// Aura Arena — Beat Detection Worker (audio BPM + energy tracking)
// Runs on AudioWorklet message bridge pattern

let _bpm = 90;
let _lastBeat = 0;
let _beats: number[] = [];
let _energyHistory: number[] = [];
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

function detectBeat(samples: Float32Array, sampleRate: number, nowMs: number): void {
  // RMS energy
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] ** 2;
  const rms = Math.sqrt(sum / samples.length);
  _energyHistory = [..._energyHistory.slice(-42), rms];

  // Beat = current energy significantly above recent average
  const avgE   = _energyHistory.reduce((a, b) => a + b, 0) / _energyHistory.length;
  const isBeat = rms > avgE * 1.4 && nowMs - _lastBeat > 200; // min 200ms between beats

  if (isBeat) {
    _lastBeat = nowMs;
    _beats = [..._beats.slice(-8), nowMs];
    // Estimate BPM from beat interval history
    if (_beats.length >= 2) {
      const intervals  = _beats.slice(1).map((t, i) => t - _beats[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      _bpm = Math.round(60000 / avgInterval);
      _bpm = Math.max(40, Math.min(220, _bpm));
    }
    post({ type: 'BEAT', bpm: _bpm, energy: Math.round(rms * 1000), timestamp: nowMs });
  }

  // Send BPM update every ~500ms regardless
  if (nowMs % 500 < 50) {
    post({ type: 'BPM_UPDATE', bpm: _bpm, energy: Math.round(rms * 1000) });
  }
}

self.addEventListener('message', (e: MessageEvent) => {
  const msg = e.data as Record<string, unknown>;
  if (msg['type'] === 'INIT') {
    _bpm = (msg['bpm'] as number) ?? 90;
    post({ type: 'READY', bpm: _bpm });
    return;
  }
  if (msg['type'] === 'AUDIO_CHUNK') {
    detectBeat(new Float32Array(msg['samples'] as ArrayBuffer), (msg['sampleRate'] as number) ?? 44100, (msg['timestamp'] as number) ?? Date.now());
    return;
  }
  if (msg['type'] === 'SET_BPM') { _bpm = msg['bpm'] as number; return; }
  if (msg['type'] === 'DESTROY') { _beats = []; _energyHistory = []; }
});
