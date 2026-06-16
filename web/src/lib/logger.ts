import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'loomo_logs.txt');

export function log(level: string, context: string, message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level.toUpperCase()}] [${context.toUpperCase()}] ${message}`;

  // Log to server console
  if (level === 'error') {
    console.error(logLine);
  } else if (level === 'warn') {
    console.warn(logLine);
  } else {
    console.log(logLine);
  }

  // Append to persistent log file asynchronously
  fs.appendFile(logFilePath, logLine + '\n', (err) => {
    if (err) {
      console.error('[Logger] Failed to write to log file:', err);
    }
  });
}

export const logger = {
  info: (context: string, message: string) => log('info', context, message),
  warn: (context: string, message: string) => log('warn', context, message),
  error: (context: string, message: string) => log('error', context, message),
};
