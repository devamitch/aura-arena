// Aura Arena — Face Worker (MediaPipe FaceLandmarker)
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import type { Landmark } from '@/types';

const WASM  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let landmarker: FaceLandmarker | null = null;
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

async function init() {
  const vision = await FilesetResolver.forVisionTasks(WASM);
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
    runningMode: 'VIDEO', numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: false,
  });
  post({ type: 'READY' });
}

function detect(bitmap: ImageBitmap, timestamp: number) {
  if (!landmarker) { bitmap.close(); return; }
  try {
    const r = landmarker.detectForVideo(bitmap, timestamp);
    const faceLandmarks = (r.faceLandmarks ?? []).map((lms: { x:number;y:number;z?:number }[]) =>
      lms.map(l => ({ x:l.x, y:l.y, z:l.z??0 }))) as Landmark[][];
    const faceBlendshapes = (r.faceBlendshapes ?? []).map((bs: { categories?: { categoryName:string;score:number }[] }) =>
      (bs.categories ?? []).slice(0,20).map((c) => ({ categoryName: c.categoryName, score: c.score })));
    post({ type: 'FACE_RESULT', faceLandmarks, faceBlendshapes, timestamp });
  } catch { /* drop */ } finally { bitmap.close(); }
}

self.addEventListener('message', async (e: MessageEvent) => {
  const msg = e.data as { type: string; bitmap?: ImageBitmap; timestamp?: number };
  if (msg.type === 'INIT') {
    try { await init(); } catch (err) { post({ type: 'ERROR', message: String(err) }); }
  } else if (msg.type === 'DETECT' && msg.bitmap) {
    detect(msg.bitmap, msg.timestamp ?? 0);
  } else if (msg.type === 'DESTROY') {
    landmarker?.close(); landmarker = null;
  }
});
