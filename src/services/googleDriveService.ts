// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Google Drive Service
// Handles exporting user training data (poses, sessions) to their Google Drive.
// Emphasizes user ownership and transparency.
// ═══════════════════════════════════════════════════════════════════════════════

const UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

/**
 * Uploads a JSON string as a file to the user's Google Drive.
 * Requires an active Google access token with the https://www.googleapis.com/auth/drive.file scope.
 */
export async function uploadDataToGoogleDrive(
  accessToken: string,
  fileName: string,
  jsonData: string,
): Promise<{ id: string; url: string }> {
  const metadata = {
    name: fileName,
    mimeType: "application/json",
    description: "Aura Arena Training Data Export",
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  formData.append("file", new Blob([jsonData], { type: "application/json" }));

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Drive Upload Failed (${response.status}): ${err}`);
  }

  const result = await response.json();
  return {
    id: result.id,
    url: `https://drive.google.com/file/d/${result.id}/view`,
  };
}

/**
 * Uploads a video blob to the user's Google Drive.
 */
export async function uploadVideoToGoogleDrive(
  accessToken: string,
  fileName: string,
  videoBlob: Blob,
): Promise<{ id: string; url: string }> {
  const metadata = {
    name: fileName,
    mimeType: "video/webm",
    description: "Aura Arena Training Video",
  };

  const formData = new FormData();
  formData.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  formData.append("file", videoBlob);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(
      `Google Drive Video Upload Failed (${response.status}): ${err}`,
    );
  }

  const result = await response.json();
  return {
    id: result.id,
    url: `https://drive.google.com/file/d/${result.id}/view`,
  };
}
