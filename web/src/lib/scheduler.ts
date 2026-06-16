import fs from 'fs/promises';
import path from 'path';
import { prisma } from './db';
import { getFreshAccessToken, getOrCreateLoomoFolders, uploadToDrive, deleteFromDrive } from './gdrive';
import { logger } from './logger';
import { getDriveOwnerId } from './workspace';

let isSchedulerRunning = false;
let schedulerIntervalId: NodeJS.Timeout | null = null;

export function startScheduler() {
  if (schedulerIntervalId) return;
  logger.info('scheduler', 'Starting background job scheduler...');
  
  // Run immediately on start
  runSchedulerOnce().catch(err => logger.error('scheduler', `Error in initial run: ${err.message || err}`));

  // Run every 10 seconds
  schedulerIntervalId = setInterval(async () => {
    await runSchedulerOnce();
  }, 10000);
}

export async function runSchedulerOnce() {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;

  try {
    // 1. Fetch pending background jobs (QUEUED or FAILED but with attempts < max_attempts)
    const jobs = await prisma.backgroundJob.findMany({
      where: {
        status: { in: ['QUEUED', 'FAILED'] },
        attempts: { lt: prisma.backgroundJob.fields.maxAttempts }
      },
      orderBy: { createdAt: 'asc' },
      take: 5 // process 5 jobs at a time
    });

    for (const job of jobs) {
      await processJob(job);
    }
  } catch (error: any) {
    logger.error('scheduler', `Scheduler run failed: ${error.message || error}`);
  } finally {
    isSchedulerRunning = false;
  }
}

async function processJob(job: any) {
  logger.info('scheduler', `Processing job ${job.id} (Type: ${job.jobType}, Media: ${job.mediaId})`);

  // Update status to RUNNING and increment attempts
  await prisma.backgroundJob.update({
    where: { id: job.id },
    data: {
      status: 'RUNNING',
      attempts: { increment: 1 },
      startedAt: new Date()
    }
  });

  try {
    // Fetch media and workspace to find the storage target user
    const media = await prisma.media.findUnique({
      where: { id: job.mediaId },
      include: { workspace: true }
    });

    if (!media) {
      throw new Error(`Media record not found for job ${job.id}`);
    }

    // Resolve target user ID based on workspace settings:
    const targetUserId = getDriveOwnerId(media.workspace, media.uploadedBy);

    const accessToken = await getFreshAccessToken(targetUserId);

    if (job.jobType === 'UPLOAD') {
      await handleUploadJob(job, accessToken);
    } else if (job.jobType === 'DELETE') {
      await handleDeleteJob(job, accessToken);
    }
  } catch (error: any) {
    logger.error('scheduler', `Job ${job.id} failed: ${error.message || error}`);
    
    // Update job status to FAILED with error message
    const updatedJob = await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message || String(error),
        completedAt: new Date()
      }
    });

    // If it's an UPLOAD job, update the media status to FAILED too (only if max attempts reached)
    if (job.jobType === 'UPLOAD' && updatedJob.attempts >= updatedJob.maxAttempts) {
      await prisma.media.update({
        where: { id: job.mediaId },
        data: { uploadStatus: 'FAILED' }
      });
    }
  }
}

async function handleUploadJob(job: any, accessToken: string) {
  const media = await prisma.media.findUnique({
    where: { id: job.mediaId }
  });

  if (!media) {
    throw new Error('Media record not found for upload job');
  }

  if (!job.tempFilePath) {
    throw new Error('No temp file path specified for upload job');
  }

  // 1. Read temp file from disk
  const fileBuffer = await fs.readFile(job.tempFilePath);

  // 2. Ensure Loomo folders exist in Google Drive
  const { screenshotsFolderId, recordingsFolderId } = await getOrCreateLoomoFolders(accessToken);
  const targetFolderId = media.type === 'SCREENSHOT' ? screenshotsFolderId : recordingsFolderId;

  // 3. Format filename to distinguish workspaces but keep standard name
  // Format: {workspaceId}_{mediaId}_{title}.ext
  const fileExt = media.type === 'SCREENSHOT' ? 'png' : 'webm';
  const cleanTitle = media.title.replace(/[^a-zA-Z0-9]/g, '_');
  const driveFilename = `${media.workspaceId}_${media.id}_${cleanTitle}.${fileExt}`;
  
  logger.info('scheduler', `Uploading filename ${driveFilename} to Google Drive...`);

  // 4. Upload file to Google Drive
  const uploadResult = await uploadToDrive(
    accessToken,
    fileBuffer,
    driveFilename,
    media.mimeType || (media.type === 'SCREENSHOT' ? 'image/png' : 'video/webm'),
    targetFolderId
  );

  // 5. Update media in DB to READY
  await prisma.media.update({
    where: { id: media.id },
    data: {
      driveFileId: uploadResult.fileId,
      driveThumbnailUrl: uploadResult.thumbnailLink,
      uploadStatus: 'READY',
      fileSizeBytes: fileBuffer.length
    }
  });

  // 6. Delete local temp file
  try {
    await fs.unlink(job.tempFilePath);
    logger.info('scheduler', `Deleted local temp file: ${job.tempFilePath}`);
  } catch (err: any) {
    logger.error('scheduler', `Failed to delete temp file ${job.tempFilePath}: ${err.message || err}`);
  }

  // 7. Update job status to COMPLETED
  await prisma.backgroundJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  logger.info('scheduler', `Job ${job.id} completed successfully!`);
}

async function handleDeleteJob(job: any, accessToken: string) {
  const media = await prisma.media.findUnique({
    where: { id: job.mediaId }
  });

  // If media already deleted, we just complete the job
  if (!media) {
    await prisma.backgroundJob.delete({
      where: { id: job.id }
    });
    return;
  }

  // 1. Delete from Google Drive if driveFileId exists
  if (media.driveFileId) {
    logger.info('scheduler', `Deleting file ${media.driveFileId} from Google Drive...`);
    await deleteFromDrive(accessToken, media.driveFileId);
  }

  // 2. Delete local temp file if it exists (e.g. if deleted while still processing/failed)
  if (job.tempFilePath) {
    try {
      await fs.unlink(job.tempFilePath);
      logger.info('scheduler', `Deleted local temp file: ${job.tempFilePath}`);
    } catch (err) {
      // Ignored if file does not exist
    }
  }

  // 3. Delete media record from DB (permanent and irreversible, as in NFR-003)
  await prisma.media.delete({
    where: { id: media.id }
  });

  // 4. Delete job record from DB
  await prisma.backgroundJob.delete({
    where: { id: job.id }
  });

  logger.info('scheduler', `Job ${job.id} (delete) completed and database cleaned up successfully!`);
}
