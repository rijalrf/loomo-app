import { prisma } from './db';
import { decrypt, encrypt } from './crypto';

interface RefreshTokenResult {
  accessToken: string;
  expiresIn: number;
}

export async function getFreshAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user) {
    throw new Error('User not found');
  }

  // Check if token is expired (we add a 5-minute buffer)
  if (user.tokenExpiresAt && user.tokenExpiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return decrypt(user.accessToken);
  }

  if (!user.refreshToken) {
    throw new Error('No refresh token available. User must re-authenticate.');
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth configuration is missing.');
  }

  const decryptedRefreshToken = decrypt(user.refreshToken);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: decryptedRefreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    // Jika refresh token invalid, throw specific error agar bisa ditangkap
    if (response.status === 400 && errText.includes('invalid_grant')) {
       throw new Error('AUTH_REVOKED');
    }
    throw new Error(`Failed to refresh Google OAuth token: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  const newAccessToken = data.access_token;
  const expiresIn = data.expires_in; // in seconds
  
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Update in DB
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: encrypt(newAccessToken),
      tokenExpiresAt
    }
  });

  return newAccessToken;
}

// Find or create Loomo folder structure
// Return folders: { screenshotsFolderId, recordingsFolderId }
export async function getOrCreateLoomoFolders(accessToken: string): Promise<{ screenshotsFolderId: string; recordingsFolderId: string }> {
  // 1. Get or create 'Loomo' root folder
  let rootFolderId = await findFolder(accessToken, 'Loomo', 'root');
  if (!rootFolderId) {
    rootFolderId = await createFolder(accessToken, 'Loomo', 'root');
  }

  // 2. Get or create 'Screenshots' subfolder inside 'Loomo'
  let screenshotsFolderId = await findFolder(accessToken, 'Screenshots', rootFolderId);
  if (!screenshotsFolderId) {
    screenshotsFolderId = await createFolder(accessToken, 'Screenshots', rootFolderId);
  }

  // 3. Get or create 'Recordings' subfolder inside 'Loomo'
  let recordingsFolderId = await findFolder(accessToken, 'Recordings', rootFolderId);
  if (!recordingsFolderId) {
    recordingsFolderId = await createFolder(accessToken, 'Recordings', rootFolderId);
  }

  return { screenshotsFolderId, recordingsFolderId };
}

export async function getOrCreateDynamicFolder(accessToken: string, pathParts: string[]): Promise<string> {
  let currentParentId = 'root';
  for (const part of pathParts) {
    if (!part || !part.trim()) continue;
    // Replace single quotes in folder name to avoid query breakage
    const cleanPart = part.replace(/'/g, "\\'");
    let folderId = await findFolder(accessToken, cleanPart, currentParentId);
    if (!folderId) {
      folderId = await createFolder(accessToken, cleanPart, currentParentId);
    }
    currentParentId = folderId;
  }
  return currentParentId;
}

async function findFolder(accessToken: string, name: string, parentId: string): Promise<string | null> {
  const query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.files?.[0]?.id || null;
}

async function createFolder(accessToken: string, name: string, parentId: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create Google Drive folder: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

export interface DriveUploadResult {
  fileId: string;
  thumbnailLink: string | null;
}

export async function uploadToDrive(
  accessToken: string,
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  parentFolderId: string
): Promise<DriveUploadResult> {
  const boundary = 'loomo_upload_boundary';
  
  const metadata = {
    name: filename,
    parents: [parentFolderId]
  };
  
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeader = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const mediaFooter = `\r\n--${boundary}--`;

  const body = Buffer.concat([
    Buffer.from(metadataPart),
    Buffer.from(mediaHeader),
    fileBuffer,
    Buffer.from(mediaFooter)
  ]);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,thumbnailLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': body.length.toString()
    },
    body
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload to Google Drive: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return {
    fileId: data.id,
    thumbnailLink: data.thumbnailLink || null
  };
}

export async function deleteFromDrive(accessToken: string, fileId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok && response.status !== 404) {
    const errText = await response.text();
    throw new Error(`Failed to delete file from Google Drive: ${response.statusText} - ${errText}`);
  }
}

export async function getFileMetadata(accessToken: string, fileId: string): Promise<any> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,thumbnailLink`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file metadata from Google Drive: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchFileStream(accessToken: string, fileId: string): Promise<Response> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to download file from Google Drive: ${response.statusText}`);
  }

  return response;
}
