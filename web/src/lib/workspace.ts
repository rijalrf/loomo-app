/**
 * Resolves the Google Drive owner ID for a media item based on workspace settings.
 * 
 * @param workspace The workspace object containing saveToOwnerDrive and createdBy
 * @param uploadedBy The ID of the user who uploaded the media
 * @returns The ID of the user whose Google Drive contains the media
 */
export function getDriveOwnerId(
  workspace: { saveToOwnerDrive: boolean | null; createdBy: string },
  uploadedBy: string
): string {
  // If saveToOwnerDrive is true, media is in workspace owner's Drive.
  // If false, media is in uploader's Drive.
  // Fall back to env DEFAULT_SAVE_TO_OWNER_DRIVE if not explicitly set.
  const defaultSaveToOwner = process.env.DEFAULT_SAVE_TO_OWNER_DRIVE !== 'false';
  
  const isSaveToOwner = workspace.saveToOwnerDrive !== null
    ? workspace.saveToOwnerDrive
    : defaultSaveToOwner;

  return isSaveToOwner ? workspace.createdBy : uploadedBy;
}
