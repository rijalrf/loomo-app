// Global error handling to log content script errors to server
window.addEventListener('error', (event) => {
  // Only handle content script errors, avoid capturing target page errors here
  if (event.filename && event.filename.includes('chrome-extension://')) {
    try {
      chrome.runtime.sendMessage({
        action: 'WRITE_LOG_TO_SERVER',
        payload: { level: 'error', context: 'content-script', message: `Unhandled Error: ${event.message} at ${event.filename}:${event.lineno}` }
      });
    } catch (e) {}
  }
});

// 1. Injeksi injected.js ke halaman utama (Main World) situs web
try {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function () {
    this.remove(); // Hapus tag script setelah dieksekusi agar DOM tetap bersih
  };
  (document.head || document.documentElement).appendChild(script);
} catch (e) {
  if (globalThis.ExtensionLogger) {
    globalThis.ExtensionLogger.error('content-script', `[Jam Extension] Gagal menginjeksi skrip pencatat: ${e.message || String(e)}`);
  } else {
    console.error('[Jam Extension] Gagal menginjeksi skrip pencatat:', e);
  }
}

// State Control Floating Bar & Screenshot
let floatingPanel = null;
let timerInterval = null;
let elapsedSeconds = 0;
let isPaused = false;

// 2. Jembatan Komunikasi: Halaman Utama -> Content Script -> Background Service Worker
window.addEventListener('message', function (event) {
  if (event.data && event.data.source === 'jam-injected-script') {
    chrome.runtime.sendMessage({
      source: 'jam-extension-content',
      type: event.data.type,
      payload: event.data.payload
    });
  }
});

// 3. Jembatan Komunikasi: Background Service Worker -> Content Script -> Halaman Utama
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'PING') {
    sendResponse({ status: 'PONG' });
    return false;
  }
  if (message.source === 'jam-extension-background') {
    if (message.action === 'START_RECORDING') {
      window.postMessage({
        source: 'jam-content-script',
        action: 'START_CAPTURE'
      }, '*');
      showFloatingControls(); // Tampilkan panel kontrol mengambang
      sendResponse({ status: 'Capture starting in tab' });
    } else if (message.action === 'STOP_RECORDING') {
      window.postMessage({
        source: 'jam-content-script',
        action: 'STOP_CAPTURE'
      }, '*');
      removeFloatingControls(); // Hapus panel kontrol mengambang
      sendResponse({ status: 'Capture stopping in tab' });
    } else if (message.action === 'INIT_SCREENSHOT_SELECTION') {
      initScreenshotSelection(); // Mulai tangkapan layar area
      sendResponse({ status: 'Screenshot selection initialized' });
    }
  }
});

const isLoomoHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '8999';
if (isLoomoHost) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('importPending') === 'true') {
    importPendingJamFromExtension();
  }
  
  // Sinkronisasikan Google OAuth Session dari LocalStorage ke Extension Storage secara otomatis
  syncSession();
  window.addEventListener('focus', syncSession);
  window.addEventListener('loomo_session_changed', syncSession);
}

function syncSession() {
  const session = localStorage.getItem('gdrive_user_session');
  if (session) {
    try {
      chrome.storage.local.set({ gdrive_user_session: JSON.parse(session) });
    } catch (e) {}
  } else {
    chrome.storage.local.remove('gdrive_user_session');
  }
}

async function importPendingJamFromExtension() {
  console.log('[Jam Extension Content] Mendeteksi data transfer ke backoffice...');
  
  chrome.runtime.sendMessage({ action: 'GET_PENDING_JAM' }, async (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[Jam Extension Content] Gagal get pending jam:', chrome.runtime.lastError.message);
      return;
    }
    if (!response) {
      console.warn('[Jam Extension Content] Tidak ada rekaman pending untuk diimpor.');
      return;
    }
    
    const { metadata, videoBase64 } = response;
    
    try {
      // Tentukan mime type berdasarkan tipe metadata (screenshot atau rekaman video)
      const mime = (metadata.type === 'screenshot') ? 'image/png' : 'video/webm';
      const videoBlob = base64ToBlob(videoBase64, mime);
      
      localStorage.setItem(`jam_meta_${metadata.id}`, JSON.stringify(metadata));
      await saveVideoToIndexedDB(metadata.id, videoBlob);
      
      console.log('[Jam Extension Content] Impor data berhasil! Memuat ulang replay...');
      window.location.href = `http://localhost:8999/?driveFileId=${metadata.id}`;
    } catch (err) {
      if (globalThis.ExtensionLogger) {
        globalThis.ExtensionLogger.error('content-script', `[Jam Extension Content] Gagal menyimpan data impor: ${err.message || String(err)}`);
      } else {
        console.error('[Jam Extension Content] Gagal menyimpan data impor:', err);
      }
    }
  });
}

function base64ToBlob(base64Data, mimeType) {
  const sliceSize = 512;
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}

function saveVideoToIndexedDB(id, blob) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('JamDevCloneDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('videos', 'readwrite');
      const store = transaction.objectStore('videos');
      const putRequest = store.put(blob, id);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos');
      }
    };
  });
}

// 5. Fungsi Tangkapan Layar Berdasarkan Area Seleksi
function initScreenshotSelection() {
  if (document.getElementById('jam-screenshot-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'jam-screenshot-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2147483647;
    background: rgba(0, 0, 0, 0.4);
    cursor: crosshair;
    user-select: none;
  `;

  const selectionBox = document.createElement('div');
  selectionBox.id = 'jam-screenshot-selection';
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px dashed #10B981;
    background: rgba(16, 185, 129, 0.15);
    display: none;
    pointer-events: none;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.4);
  `;
  overlay.appendChild(selectionBox);

  const tip = document.createElement('div');
  tip.style.cssText = `
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #0B0F19;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: sans-serif;
    font-size: 13px;
    font-weight: 500;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    border: 1px solid #232D3F;
  `;
  tip.textContent = 'Klik & seret mouse untuk memilih area tangkapan layar';
  overlay.appendChild(tip);

  let startX = 0, startY = 0;
  let isDragging = false;

  const handleMouseDown = (e) => {
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(startX - currentX);
    const height = Math.abs(startY - currentY);

    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
  };

  const handleMouseUp = async (e) => {
    if (!isDragging) return;
    isDragging = false;

    const rect = selectionBox.getBoundingClientRect();
    
    // Hapus overlay secara instan
    document.body.removeChild(overlay);

    if (rect.width < 5 || rect.height < 5) {
      console.warn('[Jam Extension] Seleksi area terlalu kecil, membatalkan screenshot.');
      return;
    }

    chrome.runtime.sendMessage({
      source: 'jam-extension-content',
      action: 'CAPTURE_VISIBLE_TAB'
    }, (response) => {
      if (chrome.runtime.lastError) {
        alert('Gagal mengambil screenshot: ' + chrome.runtime.lastError.message);
        return;
      }
      if (!response) {
        alert('Gagal mengambil screenshot: Tidak ada respon dari background service worker.');
        return;
      }
      if (response.error) {
        alert('Gagal mengambil screenshot: ' + response.error);
        return;
      }
      if (!response.dataUrl) {
        alert('Gagal mengambil screenshot: URL data gambar kosong.');
        return;
      }

      // Potong gambar menggunakan kanvas HTML5
      const img = new Image();
      img.src = response.dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        
        // Sesuaikan dimensi dengan Device Pixel Ratio browser
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(
          img,
          rect.left * dpr,
          rect.top * dpr,
          rect.width * dpr,
          rect.height * dpr,
          0,
          0,
          rect.width * dpr,
          rect.height * dpr
        );

        const croppedBase64 = canvas.toDataURL('image/png');
        
        // Simpan metadata dan gambar tangkapan layar
        saveScreenshotJam(croppedBase64, rect.width, rect.height);
      };
    });
  };

  overlay.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  
  document.body.appendChild(overlay);
}

function saveScreenshotJam(imageBase64, width, height) {
  const metadata = {
    id: generateUUID(),
    title: `Jam Screenshot - ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
    createdAt: new Date().toISOString(),
    type: 'screenshot', // Tipe: Screenshot
    duration: 0,
    systemInfo: {
      browser: 'Google Chrome (Extension)',
      os: 'Linux',
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${Math.round(width)}x${Math.round(height)}`,
      locale: navigator.language || 'id-ID'
    },
    logs: [],
    networkRequests: [],
    userActions: []
  };

  chrome.runtime.sendMessage({
    source: 'jam-extension-content',
    action: 'SAVE_SCREENSHOT',
    payload: { metadata, imageBase64 }
  });
}

// 6. Fungsi Panel Kontrol Perekaman Mengambang (Floating Control Bar)
function showFloatingControls() {
  if (document.getElementById('jam-floating-controls')) return;

  floatingPanel = document.createElement('div');
  floatingPanel.id = 'jam-floating-controls';
  floatingPanel.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #0B0F19;
    border: 1px solid #232D3F;
    border-radius: 10px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.6);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: white;
    user-select: none;
  `;

  // Titik Merah Berkedip
  const dot = document.createElement('div');
  dot.id = 'jam-floating-dot';
  dot.style.cssText = `
    width: 10px;
    height: 10px;
    background: #EF4444;
    border-radius: 50%;
  `;
  
  // Style animasi blink
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @keyframes jam-blink {
      0% { opacity: 0.3; }
      50% { opacity: 1; }
      100% { opacity: 0.3; }
    }
    .jam-blinking {
      animation: jam-blink 1s infinite;
    }
  `;
  document.head.appendChild(styleEl);
  dot.classList.add('jam-blinking');
  floatingPanel.appendChild(dot);

  const timerText = document.createElement('span');
  timerText.id = 'jam-floating-timer';
  timerText.style.cssText = `
    font-size: 13px;
    font-weight: 600;
    font-family: monospace;
    min-width: 40px;
  `;
  timerText.textContent = '00:00';
  floatingPanel.appendChild(timerText);

  // Divider
  const divider = document.createElement('div');
  divider.style.cssText = `
    width: 1px;
    height: 16px;
    background: #232D3F;
  `;
  floatingPanel.appendChild(divider);

  // Tombol Pause / Resume
  const pauseBtn = document.createElement('button');
  pauseBtn.id = 'jam-floating-btn-pause';
  pauseBtn.style.cssText = `
    background: #1F2736;
    border: 1px solid #232D3F;
    color: white;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.15s;
  `;
  pauseBtn.textContent = 'Pause';
  pauseBtn.addEventListener('mouseenter', () => pauseBtn.style.background = '#2A344A');
  pauseBtn.addEventListener('mouseleave', () => pauseBtn.style.background = '#1F2736');
  
  pauseBtn.addEventListener('click', () => {
    if (!isPaused) {
      // Jeda Perekaman (Pause)
      chrome.runtime.sendMessage({
        source: 'jam-extension-content',
        action: 'PAUSE_RECORDING'
      }, (res) => {
        if (res && res.success) {
          isPaused = true;
          pauseBtn.textContent = 'Resume';
          pauseBtn.style.borderColor = '#10B981';
          pauseBtn.style.color = '#34D399';
          dot.classList.remove('jam-blinking');
          dot.style.background = '#F59E0B'; // Indikator warna orange saat pause
          clearInterval(timerInterval);
        }
      });
    } else {
      // Lanjutkan Perekaman (Resume)
      chrome.runtime.sendMessage({
        source: 'jam-extension-content',
        action: 'RESUME_RECORDING'
      }, (res) => {
        if (res && res.success) {
          isPaused = false;
          pauseBtn.textContent = 'Pause';
          pauseBtn.style.borderColor = '#232D3F';
          pauseBtn.style.color = 'white';
          dot.classList.add('jam-blinking');
          dot.style.background = '#EF4444';
          startTimer(timerText, dot);
        }
      });
    }
  });
  floatingPanel.appendChild(pauseBtn);

  // Tombol Stop
  const stopBtn = document.createElement('button');
  stopBtn.id = 'jam-floating-btn-stop';
  stopBtn.style.cssText = `
    background: #EF4444;
    border: none;
    color: white;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.15s;
  `;
  stopBtn.textContent = 'Stop';
  stopBtn.addEventListener('mouseenter', () => stopBtn.style.background = '#DC2626');
  stopBtn.addEventListener('mouseleave', () => stopBtn.style.background = '#EF4444');
  
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      source: 'jam-extension-content',
      action: 'STOP_RECORDING'
    }, () => {
      removeFloatingControls();
    });
  });
  floatingPanel.appendChild(stopBtn);

  document.body.appendChild(floatingPanel);

  elapsedSeconds = 0;
  startTimer(timerText, dot);
}

function startTimer(timerText, dot) {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const seconds = String(elapsedSeconds % 60).padStart(2, '0');
    timerText.textContent = `${minutes}:${seconds}`;
  }, 1000);
}

function removeFloatingControls() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const el = document.getElementById('jam-floating-controls');
  if (el) {
    document.body.removeChild(el);
  }
  isPaused = false;
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


