// Aura Arena — Vision Worker Hook (pose + optional hands/face workers)
import disciplineConfig from "@/data/discipline-config.json";
import { bus } from "@/lib/eventBus";
import type { VisionFrameResult } from "@/lib/mediapipe/types";
import { EMPTY_VISION_RESULT } from "@/lib/mediapipe/types";
import { WorkerBridge } from "@/lib/workerBridge";
import { useCallback, useEffect, useRef, useState } from "react";

type DC = Record<string, { handTracking: boolean; faceTracking: boolean }>;
const DC_MAP = disciplineConfig as DC;

interface VisionState {
  poseReady: boolean;
  handsReady: boolean;
  faceReady: boolean;
  error: string | null;
}

export function useVisionWorker(discipline: string): VisionState & {
  sendFrame: (bitmap: ImageBitmap, timestamp: number) => void;
  latestResult: React.MutableRefObject<VisionFrameResult>;
} {
  const [state, setState] = useState<VisionState>({
    poseReady: false,
    handsReady: false,
    faceReady: false,
    error: null,
  });
  const poseRef = useRef<WorkerBridge | null>(null);
  const handsRef = useRef<WorkerBridge | null>(null);
  const faceRef = useRef<WorkerBridge | null>(null);
  const latestResult = useRef<VisionFrameResult>({ ...EMPTY_VISION_RESULT });
  const poseBusy = useRef(false);
  const handsBusy = useRef(false);
  const faceBusy = useRef(false);
  const cfg = DC_MAP[discipline] ?? {
    handTracking: false,
    faceTracking: false,
  };

  useEffect(() => {
    setState({
      poseReady: false,
      handsReady: false,
      faceReady: false,
      error: null,
    });
    latestResult.current = { ...EMPTY_VISION_RESULT };

    poseRef.current = new WorkerBridge(
      new URL("../workers/mediapipe/pose.worker.ts", import.meta.url),
      {
        onMessage: (e) => {
          const m = e.data as Record<string, unknown>;
          if (m["type"] === "READY") {
            setState((s) => ({ ...s, poseReady: true }));
            bus.emit("worker:ready", { worker: "pose" });
          } else if (m["type"] === "POSE_RESULT") {
            poseBusy.current = false;
            latestResult.current = {
              ...latestResult.current,
              poseLandmarks: m[
                "poseLandmarks"
              ] as VisionFrameResult["poseLandmarks"],
              poseWorldLandmarks: m[
                "poseWorldLandmarks"
              ] as VisionFrameResult["poseWorldLandmarks"],
            };
            bus.emit("pose:result", {
              poseLandmarks: m[
                "poseLandmarks"
              ] as VisionFrameResult["poseLandmarks"],
              poseWorldLandmarks: m[
                "poseWorldLandmarks"
              ] as VisionFrameResult["poseWorldLandmarks"],
              timestamp: m["timestamp"] as number,
            });
          } else if (m["type"] === "ERROR") {
            setState((s) => ({ ...s, error: m["message"] as string }));
            bus.emit("worker:error", {
              worker: "pose",
              message: m["message"] as string,
            });
          }
        },
        onError: (e) => setState((s) => ({ ...s, error: e.message })),
      },
    );
    poseRef.current.post({ type: "INIT" });

    if (cfg.handTracking) {
      handsRef.current = new WorkerBridge(
        new URL("../workers/mediapipe/hands.worker.ts", import.meta.url),
        {
          onMessage: (e) => {
            const m = e.data as Record<string, unknown>;
            if (m["type"] === "READY")
              setState((s) => ({ ...s, handsReady: true }));
            else if (m["type"] === "HANDS_RESULT") {
              handsBusy.current = false;
              latestResult.current = {
                ...latestResult.current,
                handLandmarks: m[
                  "handLandmarks"
                ] as VisionFrameResult["handLandmarks"],
                handedness: m["handedness"] as string[],
              };
              bus.emit("hands:result", {
                handLandmarks: m[
                  "handLandmarks"
                ] as VisionFrameResult["handLandmarks"],
                handedness: m["handedness"] as string[],
                timestamp: m["timestamp"] as number,
              });
            }
          },
          onError: () => {},
        },
      );
      handsRef.current.post({ type: "INIT" });
    } else {
      setState((s) => ({ ...s, handsReady: true }));
    }

    if (cfg.faceTracking) {
      faceRef.current = new WorkerBridge(
        new URL("../workers/mediapipe/face.worker.ts", import.meta.url),
        {
          onMessage: (e) => {
            const m = e.data as Record<string, unknown>;
            if (m["type"] === "READY")
              setState((s) => ({ ...s, faceReady: true }));
            else if (m["type"] === "FACE_RESULT") {
              faceBusy.current = false;
              latestResult.current = {
                ...latestResult.current,
                faceLandmarks: m[
                  "faceLandmarks"
                ] as VisionFrameResult["faceLandmarks"],
                faceBlendshapes: m[
                  "faceBlendshapes"
                ] as VisionFrameResult["faceBlendshapes"],
              };
              bus.emit("face:result", {
                faceLandmarks: m[
                  "faceLandmarks"
                ] as VisionFrameResult["faceLandmarks"],
                faceBlendshapes: m[
                  "faceBlendshapes"
                ] as VisionFrameResult["faceBlendshapes"],
                timestamp: m["timestamp"] as number,
              });
            }
          },
          onError: () => {},
        },
      );
      faceRef.current.post({ type: "INIT" });
    } else {
      setState((s) => ({ ...s, faceReady: true }));
    }

    return () => {
      poseRef.current?.destroy();
      handsRef.current?.destroy();
      faceRef.current?.destroy();
      poseRef.current = handsRef.current = faceRef.current = null;
    };
  }, [discipline]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendFrame = useCallback(
    (bitmap: ImageBitmap, timestamp: number) => {
      const sendToPose = !poseBusy.current && poseRef.current?.alive;
      const sendToHands =
        !handsBusy.current && handsRef.current?.alive && cfg.handTracking;
      const sendToFace =
        !faceBusy.current && faceRef.current?.alive && cfg.faceTracking;
      const count =
        (sendToPose ? 1 : 0) + (sendToHands ? 1 : 0) + (sendToFace ? 1 : 0);
      if (count === 0) {
        bitmap.close();
        return;
      }
      const send = async () => {
        const clones = await Promise.all(
          Array.from({ length: count }, () => createImageBitmap(bitmap)),
        );
        bitmap.close();
        let i = 0;
        if (sendToPose) {
          poseBusy.current = true;
          poseRef.current!.post(
            { type: "DETECT", bitmap: clones[i], timestamp },
            [clones[i++]],
          );
        }
        if (sendToHands) {
          handsBusy.current = true;
          handsRef.current!.post(
            { type: "DETECT", bitmap: clones[i], timestamp },
            [clones[i++]],
          );
        }
        if (sendToFace) {
          faceBusy.current = true;
          faceRef.current!.post(
            { type: "DETECT", bitmap: clones[i], timestamp },
            [clones[i++]],
          );
        }
      };
      send().catch(() => bitmap.close());
    },
    [cfg.handTracking, cfg.faceTracking],
  );

  return { ...state, sendFrame, latestResult };
}
