// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Video Upload Worker
// Handles video upload to Supabase Storage off main thread.
// Uses Fetch API directly (no Supabase SDK) for worker compatibility.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── MESSAGE TYPES ────────────────────────────────────────────────────────────

interface UploadRequest {
  type: "UPLOAD_VIDEO";
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  sessionId: string;
  videoBlob: Blob;
  bucket: string;
}

interface UploadProgressUpdate {
  type: "UPLOAD_PROGRESS";
  percent: number;
  stage: string;
}

interface UploadResult {
  type: "UPLOAD_RESULT";
  publicUrl: string;
  path: string;
  sizeBytes: number;
}

interface UploadError {
  type: "UPLOAD_ERROR";
  error: string;
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

async function handleUpload(msg: UploadRequest) {
  const post = (data: UploadProgressUpdate | UploadResult | UploadError) =>
    (self as unknown as Worker).postMessage(data);

  const path = `recordings/${msg.userId}/${msg.sessionId}.webm`;
  const storageUrl = `${msg.supabaseUrl}/storage/v1/object/${msg.bucket}/${path}`;

  try {
    post({ type: "UPLOAD_PROGRESS", percent: 10, stage: "Preparing upload…" });

    // Upload via Supabase Storage REST API
    const res = await fetch(storageUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${msg.supabaseKey}`,
        apikey: msg.supabaseKey,
        "Content-Type": "video/webm",
        "x-upsert": "true",
      },
      body: msg.videoBlob,
    });

    post({ type: "UPLOAD_PROGRESS", percent: 80, stage: "Processing…" });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Upload failed (${res.status}): ${errBody}`);
    }

    post({
      type: "UPLOAD_PROGRESS",
      percent: 95,
      stage: "Getting public URL…",
    });

    // Construct public URL
    const publicUrl = `${msg.supabaseUrl}/storage/v1/object/public/${msg.bucket}/${path}`;

    post({
      type: "UPLOAD_RESULT",
      publicUrl,
      path,
      sizeBytes: msg.videoBlob.size,
    });
  } catch (err) {
    post({ type: "UPLOAD_ERROR", error: String(err) });
  }
}

self.addEventListener("message", (e: MessageEvent) => {
  if (e.data.type === "UPLOAD_VIDEO") handleUpload(e.data);
});
