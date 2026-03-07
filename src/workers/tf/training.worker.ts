// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — TF.js Training Worker
// Retrains action classifier model on collected Gemini-labeled data.
// Runs entirely off main thread using TensorFlow.js in worker.
// Pipeline: Fetch samples → Build dataset → Train → Save → Export.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── MESSAGE TYPES ────────────────────────────────────────────────────────────

interface TrainRequest {
  type: "TRAIN_MODEL";
  supabaseUrl: string;
  supabaseKey: string;
  discipline: string;
  epochs: number;
  batchSize: number;
  sampleLimit: number;
}

interface TrainProgress {
  type: "TRAIN_PROGRESS";
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy: number;
  stage: string;
}

interface TrainResult {
  type: "TRAIN_RESULT";
  modelJson: string;
  weightsBuffer: ArrayBuffer;
  accuracy: number;
  samplesUsed: number;
  labels: string[];
}

interface TrainError {
  type: "TRAIN_ERROR";
  error: string;
}

// ─── SUPABASE FETCH HELPER ───────────────────────────────────────────────────

async function fetchSamples(
  url: string,
  key: string,
  discipline: string,
  limit: number,
) {
  const params = new URLSearchParams({
    discipline: `eq.${discipline}`,
    order: "created_at.desc",
    limit: String(limit),
    select: "keypoints,gemini_label,gemini_score",
  });

  const res = await fetch(`${url}/rest/v1/training_samples?${params}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  if (!res.ok) throw new Error(`Fetch samples failed: ${res.status}`);
  return res.json();
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

async function handleTrain(msg: TrainRequest) {
  const post = (data: TrainProgress | TrainResult | TrainError) =>
    (self as unknown as Worker).postMessage(data);

  try {
    // 1. Fetch training data
    post({
      type: "TRAIN_PROGRESS",
      epoch: 0,
      totalEpochs: msg.epochs,
      loss: 0,
      accuracy: 0,
      stage: "Fetching training data…",
    });

    const rawSamples = await fetchSamples(
      msg.supabaseUrl,
      msg.supabaseKey,
      msg.discipline,
      msg.sampleLimit,
    );

    if (!rawSamples || rawSamples.length < 10) {
      post({
        type: "TRAIN_ERROR",
        error: `Need ≥10 samples, got ${rawSamples?.length ?? 0}. Keep training to collect more data!`,
      });
      return;
    }

    // 2. Build label map
    const uniqueLabels: string[] = [
      ...new Set(rawSamples.map((s: any) => s.gemini_label)),
    ].sort() as string[];
    const labelToIdx = new Map(
      uniqueLabels.map((l: string, i: number) => [l, i]),
    );

    post({
      type: "TRAIN_PROGRESS",
      epoch: 0,
      totalEpochs: msg.epochs,
      loss: 0,
      accuracy: 0,
      stage: `Building dataset (${rawSamples.length} samples, ${uniqueLabels.length} labels)…`,
    });

    // 3. Import TF.js
    const tf = await import("@tensorflow/tfjs");

    // 4. Prepare tensors
    const keypointArrays = rawSamples.map((s: any) => {
      const flat = (s.keypoints as number[][]).flat();
      // Normalize to fixed size (33 landmarks × 3 coords = 99)
      const target = new Float32Array(99);
      for (let i = 0; i < Math.min(flat.length, 99); i++) target[i] = flat[i];
      return target;
    });

    const xs = tf.tensor2d(keypointArrays);
    const ys = tf.oneHot(
      tf.tensor1d(
        rawSamples.map((s: any) => labelToIdx.get(s.gemini_label) ?? 0),
        "int32",
      ),
      uniqueLabels.length,
    );

    // 5. Build model
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ inputShape: [99], units: 128, activation: "relu" }),
    );
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 64, activation: "relu" }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(
      tf.layers.dense({ units: uniqueLabels.length, activation: "softmax" }),
    );

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    // 6. Train
    await model.fit(xs, ys, {
      epochs: msg.epochs,
      batchSize: msg.batchSize,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          post({
            type: "TRAIN_PROGRESS",
            epoch: epoch + 1,
            totalEpochs: msg.epochs,
            loss: logs?.loss ?? 0,
            accuracy: logs?.acc ?? logs?.accuracy ?? 0,
            stage: `Epoch ${epoch + 1}/${msg.epochs}`,
          });
        },
      },
    });

    // 7. Export model
    post({
      type: "TRAIN_PROGRESS",
      epoch: msg.epochs,
      totalEpochs: msg.epochs,
      loss: 0,
      accuracy: 0,
      stage: "Exporting model…",
    });

    // Save to in-memory handler
    let modelJson = "";
    let weightsBuffer = new ArrayBuffer(0);

    await model.save({
      save: async (artifacts: any) => {
        modelJson = JSON.stringify(artifacts.modelTopology);
        if (artifacts.weightData) {
          weightsBuffer = artifacts.weightData;
        }
        return {
          modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: "JSON",
          },
        };
      },
    } as any);

    // Get final accuracy
    const evalResult = model.evaluate(xs, ys) as tf.Tensor[];
    const finalAccuracy = (await evalResult[1].data())[0];

    // Cleanup
    xs.dispose();
    ys.dispose();
    model.dispose();

    post({
      type: "TRAIN_RESULT",
      modelJson,
      weightsBuffer,
      accuracy: finalAccuracy,
      samplesUsed: rawSamples.length,
      labels: uniqueLabels,
    });
  } catch (err) {
    post({ type: "TRAIN_ERROR", error: String(err) });
  }
}

self.addEventListener("message", (e: MessageEvent) => {
  if (e.data.type === "TRAIN_MODEL") handleTrain(e.data);
});
