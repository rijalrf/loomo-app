/**
 * Client-side Logger for Loomo Web Application
 * Safely runs in the browser and forwards logs to the backend log API.
 */

export function clientLog(level: 'info' | 'warn' | 'error', context: string, ...args: any[]) {
  const message = args.map(a => {
    if (a instanceof Error) {
      return a.stack || a.message;
    }
    return typeof a === 'object' ? JSON.stringify(a) : String(a);
  }).join(' ');
  
  // 1. Output to browser developer console
  if (level === 'error') {
    console.error(`[${context.toUpperCase()}]`, ...args);
  } else if (level === 'warn') {
    console.warn(`[${context.toUpperCase()}]`, ...args);
  } else {
    console.log(`[${context.toUpperCase()}]`, ...args);
  }

  // 2. Post to the backend logger endpoint
  if (typeof window !== 'undefined') {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, context, message })
    }).catch(() => {
      // Ignore server logging failures in browser
    });
  }
}

export const clientLogger = {
  info: (context: string, ...args: any[]) => clientLog('info', context, ...args),
  warn: (context: string, ...args: any[]) => clientLog('warn', context, ...args),
  error: (context: string, ...args: any[]) => clientLog('error', context, ...args),
};
