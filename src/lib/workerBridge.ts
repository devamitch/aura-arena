// Aura Arena — Worker Bridge (typed, lifecycle-managed worker wrapper)
type MsgHandler = (msg: MessageEvent) => void;
type ErrHandler = (err: ErrorEvent) => void;

export interface WorkerBridgeOptions {
  onMessage?: MsgHandler;
  onError?:   ErrHandler;
}

export class WorkerBridge {
  private _worker: Worker;
  private _alive  = true;

  constructor(url: URL, opts: WorkerBridgeOptions = {}) {
    this._worker = new Worker(url, { type: 'module' });
    if (opts.onMessage) this._worker.onmessage = (e) => { if (this._alive) opts.onMessage!(e); };
    if (opts.onError)   this._worker.onerror   = (e) => { if (this._alive) opts.onError!(e); };
  }

  post(data: unknown, transfer?: Transferable[]): void {
    if (!this._alive) return;
    transfer ? this._worker.postMessage(data, transfer) : this._worker.postMessage(data);
  }

  destroy(gracefulMs = 200): void {
    if (!this._alive) return;
    this._alive = false;
    this._worker.postMessage({ type: 'DESTROY' });
    setTimeout(() => this._worker.terminate(), gracefulMs);
  }

  get alive() { return this._alive; }
}

// Convenience: create bridge + return typed post fn
export function createWorkerBridge(
  url: URL,
  onMessage: MsgHandler,
  onError?: (msg: string) => void,
): WorkerBridge {
  return new WorkerBridge(url, {
    onMessage,
    onError: (e) => onError?.(e.message ?? 'Worker error'),
  });
}
