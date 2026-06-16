(function () {
  // Cegah injeksi ganda pada halaman yang sama
  if (window.__jam_extension_injected__) return;
  window.__jam_extension_injected__ = true;

  let isCapturing = false;
  let startTime = 0;

  // Mendengarkan instruksi kontrol dari content.js
  window.addEventListener('message', function (event) {
    if (event.data && event.data.source === 'jam-content-script') {
      if (event.data.action === 'START_CAPTURE') {
        isCapturing = true;
        startTime = Date.now();
        sendToContent('CAPTURE_CONFIRMED', { startTime });
      } else if (event.data.action === 'STOP_CAPTURE') {
        isCapturing = false;
      }
    }
  });

  function sendToContent(type, payload) {
    window.postMessage({
      source: 'jam-injected-script',
      type: type,
      payload: payload
    }, '*');
  }

  // --- INTERSEPT KONSOL (CONSOLE LOGS) ---
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  console.log = function (...args) {
    if (isCapturing) {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      sendToContent('CONSOLE_LOG', {
        type: 'log',
        message: msg,
        timestamp: Date.now() - startTime
      });
    }
    originalConsole.log.apply(console, args);
  };

  console.info = function (...args) {
    if (isCapturing) {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      sendToContent('CONSOLE_LOG', {
        type: 'info',
        message: msg,
        timestamp: Date.now() - startTime
      });
    }
    originalConsole.info.apply(console, args);
  };

  console.warn = function (...args) {
    if (isCapturing) {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      sendToContent('CONSOLE_LOG', {
        type: 'warn',
        message: msg,
        timestamp: Date.now() - startTime
      });
    }
    originalConsole.warn.apply(console, args);
  };

  console.error = function (...args) {
    if (isCapturing) {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      const stack = new Error().stack;
      sendToContent('CONSOLE_LOG', {
        type: 'error',
        message: msg,
        stack: stack,
        timestamp: Date.now() - startTime
      });
    }
    originalConsole.error.apply(console, args);
  };

  // --- INTERSEPT FETCH API (NETWORK REQUESTS) ---
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    if (!isCapturing) {
      return originalFetch(input, init);
    }

    const startUrl = typeof input === 'string' ? input : (input && (input.url || '')) || '';
    const method = init?.method || 'GET';
    const requestHeaders = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => { requestHeaders[k] = v; });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => { requestHeaders[k] = v; });
      } else {
        Object.assign(requestHeaders, init.headers);
      }
    }
    const requestBody = init?.body ? String(init.body) : undefined;
    const reqStartTime = Date.now();

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - reqStartTime;
      const status = response.status;
      const responseHeaders = {};
      response.headers.forEach((v, k) => { responseHeaders[k] = v; });

      let responseBody = '';
      try {
        const clonedResponse = response.clone();
        responseBody = await clonedResponse.text();
        if (responseBody.length > 3000) {
          responseBody = responseBody.substring(0, 3000) + '... [Truncated]';
        }
      } catch (e) {
        responseBody = '[Gagal membaca body respons]';
      }

      // Jangan kirim log fetch internal Google Drive API atau Chrome Extension internal
      if (!startUrl.includes('googleapis.com') && !startUrl.startsWith('chrome-extension://')) {
        sendToContent('NETWORK_REQUEST', {
          method,
          url: startUrl,
          status,
          duration,
          requestHeaders,
          requestBody,
          responseHeaders,
          responseBody,
          timestamp: reqStartTime - startTime
        });
      }

      return response;
    } catch (err) {
      const duration = Date.now() - reqStartTime;
      if (!startUrl.includes('googleapis.com') && !startUrl.startsWith('chrome-extension://')) {
        sendToContent('NETWORK_REQUEST', {
          method,
          url: startUrl,
          status: 0,
          duration,
          requestHeaders,
          requestBody,
          responseBody: `Error: ${err.message}`,
          timestamp: reqStartTime - startTime
        });
      }
      throw err;
    }
  };

  // --- INTERSEPT ERROR TIDAK TERTANGANI (UNHANDLED EXCEPTIONS) ---
  window.addEventListener('error', function (e) {
    if (isCapturing) {
      sendToContent('CONSOLE_LOG', {
        type: 'error',
        message: `Unhandled Exception: ${e.message}`,
        stack: e.error?.stack,
        timestamp: Date.now() - startTime
      });
      sendToContent('USER_ACTION', {
        type: 'error',
        target: 'Window Exception',
        details: e.message,
        timestamp: Date.now() - startTime
      });
    }
  });

  window.addEventListener('unhandledrejection', function (e) {
    if (isCapturing) {
      const msg = typeof e.reason === 'object' ? JSON.stringify(e.reason) : String(e.reason);
      sendToContent('CONSOLE_LOG', {
        type: 'error',
        message: `Unhandled Promise Rejection: ${msg}`,
        timestamp: Date.now() - startTime
      });
      sendToContent('USER_ACTION', {
        type: 'error',
        target: 'Promise Rejection',
        details: msg,
        timestamp: Date.now() - startTime
      });
    }
  });

  // --- PENYADAP TINDAKAN KLIK PENGGUNA (USER ACTIONS) ---
  document.addEventListener('click', function (e) {
    if (!isCapturing) return;
    const target = e.target;
    if (!target) return;

    let targetDesc = target.tagName.toLowerCase();
    if (target.id) targetDesc += `#${target.id}`;
    if (target.className && typeof target.className === 'string') {
      const classes = target.className.split(' ').join('.');
      if (classes) targetDesc += `.${classes}`;
    }

    const textContent = target.textContent?.trim() || '';
    const details = textContent ? `Mengklik teks: "${textContent.substring(0, 30)}"` : '';

    sendToContent('USER_ACTION', {
      type: 'click',
      target: targetDesc,
      details: details,
      timestamp: Date.now() - startTime
    });
  }, true);

})();
