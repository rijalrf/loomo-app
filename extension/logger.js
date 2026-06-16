// Diagnostic Logger for Jam.dev Clone Extension
const LOG_LIMIT = 300;
const STORAGE_KEY = 'extension_debug_logs';

class ExtensionLogger {
  static log(level, context, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const logLine = `[${timestamp}] [${level.toUpperCase()}] [${context.toUpperCase()}] ${message}`;

    // Print to developer console
    if (level === 'error') {
      console.error(logLine);
    } else if (level === 'warn') {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }

    // Save to storage
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        let logs = result[STORAGE_KEY] || [];
        logs.push(logLine);
        if (logs.length > LOG_LIMIT) {
          logs = logs.slice(logs.length - LOG_LIMIT);
        }
        chrome.storage.local.set({ [STORAGE_KEY]: logs });
      });
    } catch (e) {
      // Storage might not be accessible in some injected scripts
    }

    // Kirim ke physical log server
    // Jika bukan di background script, delegasikan ke background script untuk menghindari pemblokiran CSP halaman web
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && context !== 'background') {
        chrome.runtime.sendMessage({
          action: 'WRITE_LOG_TO_SERVER',
          payload: { level, context, message }
        });
      } else {
        // Jika di background script, kirim fetch langsung
        fetch('http://localhost:8999/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, context, message })
        }).catch(() => {
          // Abaikan jika server log mati
        });
      }
    } catch (e) {
      // Abaikan
    }
  }

  static info(context, ...args) { this.log('info', context, ...args); }
  static warn(context, ...args) { this.log('warn', context, ...args); }
  static error(context, ...args) { this.log('error', context, ...args); }

  static getLogs() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          resolve(result[STORAGE_KEY] || []);
        });
      } catch (e) {
        resolve([]);
      }
    });
  }

  static clearLogs() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.remove(STORAGE_KEY, () => resolve());
      } catch (e) {
        resolve();
      }
    });
  }
}

// Bind to global scope based on environment
if (typeof globalThis !== 'undefined') {
  globalThis.ExtensionLogger = ExtensionLogger;
}
