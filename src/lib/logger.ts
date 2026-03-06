// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Logger
// Production-safe structured logger. In prod: only warn/error reach the console.
// In dev: all levels print with color-coded prefixes.
// ═══════════════════════════════════════════════════════════════════════════════

const IS_DEV = (import.meta as any).env?.DEV ?? false;
const IS_PROD = !IS_DEV;

type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, scope: string, msg: string, data?: unknown) {
  const prefix = `[AA:${scope}]`;
  if (IS_PROD && (level === 'debug' || level === 'info')) return;

  switch (level) {
    case 'debug': console.debug(`%c${prefix}`, 'color:#64748b', msg, data ?? ''); break;
    case 'info':  console.info(`%c${prefix}`, 'color:#22d3ee', msg, data ?? ''); break;
    case 'warn':  console.warn(`%c${prefix}`, 'color:#f59e0b', msg, data ?? ''); break;
    case 'error': console.error(`%c${prefix}`, 'color:#ef4444', msg, data ?? ''); break;
  }
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, data?: unknown) => emit('debug', scope, msg, data),
    info:  (msg: string, data?: unknown) => emit('info',  scope, msg, data),
    warn:  (msg: string, data?: unknown) => emit('warn',  scope, msg, data),
    error: (msg: string, data?: unknown) => emit('error', scope, msg, data),
  };
}

// Default app-level logger
export const log = createLogger('App');
