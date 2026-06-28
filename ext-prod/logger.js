const logger = {
  log: (...args) => {
    if (globalThis.LoomoConfig?.DEBUG) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (globalThis.LoomoConfig?.DEBUG) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  },
  info: (...args) => {
    if (globalThis.LoomoConfig?.DEBUG) {
      console.info(...args);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}

if (typeof globalThis !== 'undefined') {
  globalThis.logger = logger;
}
