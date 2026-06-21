import fs from "fs/promises";
import { prisma } from "./db";
import {
  getFreshAccessToken,
  getOrCreateDynamicFolder,
  uploadToDrive,
  deleteFromDrive,
} from "./gdrive";
import { getDriveOwnerId } from "./workspace";

export function startScheduler() {
  const g = global as any;
  if (g.schedulerIntervalId) return;

  // Skip starting the interval scheduler in serverless environments or during build
  if (process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }

  // logger.info('scheduler', 'Starting background job scheduler...');
  console.log("scheduler", "Starting background job scheduler...");

  // Run immediately on start (deferred to next tick to ensure imports are bound)
  setTimeout(() => {
    runSchedulerOnce().catch((err) =>
      console.error("scheduler", `Error in initial run: ${err.message || err}`),
    );
  }, 0);

  // Run every 10 seconds
  g.schedulerIntervalId = setInterval(async () => {
    await runSchedulerOnce();
  }, 10000);
}

export async function runSchedulerOnce() {
  const g = global as any;
  if (g.isSchedulerRunning) return;
  g.isSchedulerRunning = true;

  try {
    // 1. Fetch pending background jobs (QUEUED or FAILED but with attempts < max_attempts)
    const jobs = await prisma.backgroundJob.findMany({
      where: {
        status: { in: ["QUEUED", "FAILED"] },
        attempts: { lt: prisma.backgroundJob.fields.maxAttempts },
      },
      orderBy: { createdAt: "asc" },
      take: 5, // process 5 jobs at a time
    });

    for (const job of jobs) {
      await processJob(job);
    }
  } catch (error: any) {
    console.error(
      "scheduler",
      `Scheduler run failed: ${error.message || error}`,
    );
  } finally {
    g.isSchedulerRunning = false;
  }
}

async function processJob(job: any) {
  console.log(
    "scheduler",
    `Processing job ${job.id} (Type: ${job.jobType}, Media: ${job.mediaId})`,
  );

  // Update status to RUNNING and increment attempts
  await prisma.backgroundJob.update({
    where: { id: job.id },
    data: {
      status: "RUNNING",
      attempts: { increment: 1 },
      startedAt: new Date(),
    },
  });

  try {
    // Fetch media and workspace to find the storage target user
    const media = await prisma.media.findUnique({
      where: { id: job.mediaId },
      include: { workspace: true, folder: true },
    });

    if (!media) {
      throw new Error(`Media record not found for job ${job.id}`);
    }

    // Resolve target user ID based on workspace settings:
    const targetUserId = getDriveOwnerId(media.workspace, media.uploadedBy);

    const accessToken = await getFreshAccessToken(targetUserId);

    if (job.jobType === "UPLOAD") {
      await handleUploadJob(job, accessToken, media);
    } else if (job.jobType === "DELETE") {
      await handleDeleteJob(job, accessToken);
    }
  } catch (error: any) {
    console.error(
      "scheduler",
      `Job ${job.id} failed: ${error.message || error}`,
    );

    // Update job status to FAILED with error message
    const updatedJob = await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: error.message || String(error),
        completedAt: new Date(),
      },
    });

    // If it's an UPLOAD job, update the media status to FAILED too (only if max attempts reached)
    if (
      job.jobType === "UPLOAD" &&
      updatedJob.attempts >= updatedJob.maxAttempts
    ) {
      await prisma.media.update({
        where: { id: job.mediaId },
        data: { uploadStatus: "FAILED" },
      });
    }
  }
}

async function handleUploadJob(job: any, accessToken: string, media: any) {
  if (!media) {
    throw new Error("Media record not found for upload job");
  }

  if (!job.tempFilePath) {
    throw new Error("No temp file path specified for upload job");
  }

  // 1. Read temp file from disk
  const fileBuffer = await fs.readFile(job.tempFilePath);

  // 2. Ensure Loomo folders exist in Google Drive dynamically
  const pathParts = ["Loomo"];
  if (media.workspace?.name) {
    pathParts.push(media.workspace.name);
  }
  if (media.folder?.name) {
    pathParts.push(media.folder.name);
  }
  pathParts.push(media.type === "SCREENSHOT" ? "Screenshots" : "Recordings");

  const targetFolderId = await getOrCreateDynamicFolder(accessToken, pathParts);

  // 3. Format filename using format: [namaWorkspace]_[tgltime]_[shortId]_loomo.ext
  const cleanWorkspaceName = (media.workspace?.name || "Workspace").replace(/[^a-zA-Z0-9]+/g, "_");
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateVal = new Date(media.createdAt);
  const tgltime = `${dateVal.getFullYear()}${pad(dateVal.getMonth() + 1)}${pad(dateVal.getDate())}_${pad(dateVal.getHours())}${pad(dateVal.getMinutes())}${pad(dateVal.getSeconds())}`;
  const shortId = media.id.substring(0, 8);
  const fileExt = media.type === "SCREENSHOT" ? "png" : "webm";
  const driveFilename = `${cleanWorkspaceName}_${tgltime}_${shortId}_loomo.${fileExt}`;

  console.log(
    "scheduler",
    `Uploading filename ${driveFilename} to Google Drive...`,
  );

  // 4. Upload file to Google Drive
  const uploadResult = await uploadToDrive(
    accessToken,
    fileBuffer,
    driveFilename,
    media.mimeType ||
      (media.type === "SCREENSHOT" ? "image/png" : "video/webm"),
    targetFolderId,
  );

  // 5. Update media in DB to READY
  await prisma.media.update({
    where: { id: media.id },
    data: {
      driveFileId: uploadResult.fileId,
      driveThumbnailUrl: uploadResult.thumbnailLink,
      uploadStatus: "READY",
      fileSizeBytes: fileBuffer.length,
    },
  });

  // 6. Delete local temp file
  try {
    await fs.unlink(job.tempFilePath);
    console.log("scheduler", `Deleted local temp file: ${job.tempFilePath}`);
  } catch (err: any) {
    console.error(
      "scheduler",
      `Failed to delete temp file ${job.tempFilePath}: ${err.message || err}`,
    );
  }

  // 7. Update job status to COMPLETED
  await prisma.backgroundJob.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  console.log("scheduler", `Job ${job.id} completed successfully!`);
}

async function handleDeleteJob(job: any, accessToken: string) {
  const media = await prisma.media.findUnique({
    where: { id: job.mediaId },
  });

  // If media already deleted, we just complete the job
  if (!media) {
    await prisma.backgroundJob.delete({
      where: { id: job.id },
    });
    return;
  }

  // 1. Delete from Google Drive if driveFileId exists
  if (media.driveFileId) {
    console.log(
      "scheduler",
      `Deleting file ${media.driveFileId} from Google Drive...`,
    );
    await deleteFromDrive(accessToken, media.driveFileId);
  }

  // 2. Delete local temp file if it exists (e.g. if deleted while still processing/failed)
  if (job.tempFilePath) {
    try {
      await fs.unlink(job.tempFilePath);
      console.log("scheduler", `Deleted local temp file: ${job.tempFilePath}`);
    } catch (err) {
      // Ignored if file does not exist
    }
  }

  // 3. Delete media record from DB (permanent and irreversible, as in NFR-003)
  await prisma.media.delete({
    where: { id: media.id },
  });

  // 4. Delete job record from DB
  await prisma.backgroundJob.delete({
    where: { id: job.id },
  });

  console.log(
    "scheduler",
    `Job ${job.id} (delete) completed and database cleaned up successfully!`,
  );
}
