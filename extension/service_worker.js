import './logger.js';
const ExtensionLogger = globalThis.ExtensionLogger;

// Global error handling to log background service worker errors to server
self.addEventListener('error', (event) => {
  if (typeof ExtensionLogger !== 'undefined') {
    ExtensionLogger.error('background', `Unhandled error: ${event.message} at ${event.filename}:${event.lineno}`);
  }
});
self.addEventListener('unhandledrejection', (event) => {
  if (typeof ExtensionLogger !== 'undefined') {
    ExtensionLogger.error('background', `Unhandled promise rejection: ${event.reason}`);
  }
});

// State Perekaman Global di Background
let isRecording = false;
let startTime = 0;
let activeTabId = null;

let logs = [];
let networkRequests = [];
let userActions = [];

// Mendengarkan pesan dari Content Script, Popup, dan Offscreen Document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Jembatan Penulisan Log Fisik (dari content script / popup)
  if (message.action === 'WRITE_LOG_TO_SERVER') {
    const { level, context, message: msgText } = message.payload;
    fetch('http://localhost:8999/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, context, message: msgText })
    }).catch(() => {});
    return false; 
  }

  // Handle closing the current popup/window
  if (message.action === 'CLOSE_CURRENT_WINDOW') {
    if (sender && sender.tab && typeof sender.tab.windowId !== 'undefined') {
      chrome.windows.remove(sender.tab.windowId);
    }
    return false;
  }

  // 1. Log Penyadapan Halaman Target (dari content.js)
  if (message.source === 'jam-extension-content' && isRecording) {
    if (message.type === 'CONSOLE_LOG') {
      logs.push(message.payload);
    } else if (message.type === 'NETWORK_REQUEST') {
      networkRequests.push(message.payload);
    } else if (message.type === 'USER_ACTION') {
      userActions.push(message.payload);
    }
  }

  // 2. Instruksi Kontrol dari Popup (popup.js) atau Content Script (floating control bar)
  if (message.source === 'jam-extension-popup' || message.source === 'jam-extension-content') {
    if (message.action === 'START_RECORDING') {
      startRecordingFlow(sendResponse);
      return true; // async response
    } else if (message.action === 'STOP_RECORDING') {
      stopRecordingFlow(sendResponse);
      return true; // async response
    } else if (message.action === 'PAUSE_RECORDING') {
      chrome.runtime.sendMessage({
        source: 'jam-extension-background',
        action: 'PAUSE_OFFSCREEN_CAPTURE'
      });
      sendResponse({ success: true });
    } else if (message.action === 'RESUME_RECORDING') {
      chrome.runtime.sendMessage({
        source: 'jam-extension-background',
        action: 'RESUME_OFFSCREEN_CAPTURE'
      });
      sendResponse({ success: true });
    } else if (message.action === 'GET_STATUS') {
      sendResponse({ isRecording, elapsed: isRecording ? Math.round((Date.now() - startTime) / 1000) : 0 });
    } else if (message.action === 'START_SCREENSHOT') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) {
          sendResponse({ success: false, error: 'Tidak ada tab aktif yang ditemukan.' });
          return;
        }

        // Cek apakah content script sudah aktif di tab tersebut
        chrome.tabs.sendMessage(activeTab.id, { action: 'PING' }, (pingRes) => {
          if (chrome.runtime.lastError) {
            // Jika belum diinjeksi, injeksi programmatically!
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: ['logger.js']
            }).then(() => {
              return chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
              });
            }).then(() => {
              // Tunggu sejenak agar skrip terinisialisasi
              setTimeout(() => {
                chrome.tabs.sendMessage(activeTab.id, {
                  source: 'jam-extension-background',
                  action: 'INIT_SCREENSHOT_SELECTION'
                }, (res) => {
                  if (chrome.runtime.lastError) {
                    sendResponse({ success: false, error: 'Gagal menginisialisasi area tangkapan layar.' });
                  } else {
                    sendResponse({ success: true });
                  }
                });
              }, 150);
            }).catch((err) => {
              sendResponse({ success: false, error: 'Halaman sistem/Chrome Web Store tidak didukung untuk tangkapan layar.' });
            });
          } else {
            // Jika sudah aktif, jalankan perintah
            chrome.tabs.sendMessage(activeTab.id, {
              source: 'jam-extension-background',
              action: 'INIT_SCREENSHOT_SELECTION'
            }, (res) => {
              if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: 'Gagal menginisialisasi area tangkapan layar.' });
              } else {
                sendResponse({ success: true });
              }
            });
          }
        });
      });
      return true;
    } else if (message.action === 'CAPTURE_VISIBLE_TAB') {
      const windowId = (sender && sender.tab) ? sender.tab.windowId : null;
      const performCapture = (winId) => {
        chrome.tabs.captureVisibleTab(winId, { format: 'png' }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            if (winId !== null) {
              // Clear error and fallback to default window capture
              const errMsg = chrome.runtime.lastError.message;
              console.warn('[Jam Extension] captureVisibleTab failed for windowId, falling back to default:', errMsg);
              performCapture(null);
            } else {
              ExtensionLogger.error('background', `[Jam Extension] captureVisibleTab error: ${chrome.runtime.lastError.message}`);
              sendResponse({ error: chrome.runtime.lastError.message });
            }
          } else {
            sendResponse({ dataUrl });
          }
        });
      };
      performCapture(windowId);
      return true;
    } else if (message.action === 'SAVE_SCREENSHOT') {
      const { metadata, imageBase64 } = message.payload;
      chrome.storage.local.set({
        pending_jam_metadata: metadata,
        pending_jam_video: imageBase64
      }, () => {
        const backofficeUrl = `http://localhost:8999/?importPending=true&isPopup=true`;
        chrome.windows.create({
          url: backofficeUrl,
          type: 'popup',
          width: 1024,
          height: 768
        });
      });
    }
  }

  // 3. Terima Video Blob dari Offscreen Document (offscreen.js)
  if (message.source === 'jam-extension-offscreen' && message.action === 'VIDEO_BLOB_READY') {
    saveRecordingAndRedirect(message.payload);
  }

  // 4. Jembatan Impor Data untuk Backoffice LocalStorage
  if (message.action === 'GET_PENDING_JAM') {
    chrome.storage.local.get(['pending_jam_metadata', 'pending_jam_video'], (result) => {
      if (result.pending_jam_metadata) {
        sendResponse({
          metadata: result.pending_jam_metadata,
          videoBase64: result.pending_jam_video
        });
        // Bersihkan storage setelah dibaca agar tidak menumpuk
        chrome.storage.local.remove(['pending_jam_metadata', 'pending_jam_video']);
      } else {
        sendResponse(null);
      }
    });
    return true; // async
  }
});

// Memulai Perekaman
async function startRecordingFlow(sendResponse) {
  try {
    // A. Dapatkan tab aktif saat ini
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ success: false, error: 'Tidak ada tab aktif yang ditemukan.' });
      return;
    }

    activeTabId = tab.id;
    isRecording = true;
    startTime = Date.now();
    logs = [];
    networkRequests = [];
    userActions = [];

    // B. Beri tahu content script tab aktif untuk mulai menyadap (dengan auto-injeksi jika diperlukan)
    const pingSuccess = await new Promise((resolve) => {
      chrome.tabs.sendMessage(activeTabId, { action: 'PING' }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });

    if (!pingSuccess) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          files: ['logger.js']
        });
        await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          files: ['content.js']
        });
        await new Promise(r => setTimeout(r, 150));
      } catch (err) {
        console.warn('Gagal melakukan injeksi skrip rekam:', err);
      }
    }

    await chrome.tabs.sendMessage(activeTabId, {
      source: 'jam-extension-background',
      action: 'START_RECORDING'
    }).catch((e) => console.log('Mungkin skrip belum dimuat pada halaman sistem:', e));

    // C. Dapatkan streamId tabCapture untuk tab aktif (merekam tab tanpa prompt dialog sharing)
    const streamId = await new Promise((resolve) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: activeTabId }, (id) => {
        if (chrome.runtime.lastError) {
          console.warn('Gagal mengambil streamId tabCapture:', chrome.runtime.lastError.message);
          resolve(null);
        } else {
          resolve(id);
        }
      });
    });

    // D. Buat offscreen document untuk merekam video (karena worker Manifest V3 tidak punya DOM API)
    await createOffscreenDocument();

    // E. Beri tahu offscreen untuk mulai menangkap
    chrome.runtime.sendMessage({
      source: 'jam-extension-background',
      action: 'START_OFFSCREEN_CAPTURE',
      payload: { streamId }
    });

    sendResponse({ success: true });
  } catch (err) {
    ExtensionLogger.error('background', `Gagal memulai alur perekaman: ${err.message || String(err)}`);
    isRecording = false;
    sendResponse({ success: false, error: err.message });
  }
}

// Menghentikan Perekaman
async function stopRecordingFlow(sendResponse) {
  if (!isRecording) {
    sendResponse({ success: false, error: 'Perekaman tidak aktif.' });
    return;
  }

  // A. Beri tahu content script halaman target untuk stop menyadap
  if (activeTabId) {
    await chrome.tabs.sendMessage(activeTabId, {
      source: 'jam-extension-background',
      action: 'STOP_RECORDING'
    }).catch(() => {});
  }

  // B. Beri tahu offscreen document untuk menghentikan media recorder
  chrome.runtime.sendMessage({
    source: 'jam-extension-background',
    action: 'STOP_OFFSCREEN_CAPTURE'
  });

  isRecording = false;
  sendResponse({ success: true });
}

// Membuat Offscreen Document
async function createOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  
  // Periksa apakah offscreen sudah ada
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) return;

  // Buat offscreen baru
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Merekam layar tab aktif dan mikrofon untuk laporan bug.'
  });
}

// Menyimpan Hasil dan Mengarahkan ke Backoffice
async function saveRecordingAndRedirect(videoDataBase64) {
  // A. Hapus offscreen document karena perekaman selesai
  chrome.offscreen.closeDocument().catch(() => {});
 
  const durationSec = Math.round((Date.now() - startTime) / 1000);

  // Find target tab to send progress/alert messages to
  let targetTabId = activeTabId;
  if (!targetTabId) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        targetTabId = activeTab.id;
      }
    } catch (e) {}
  }

  if (targetTabId) {
    chrome.tabs.sendMessage(targetTabId, {
      source: 'jam-extension-background',
      action: 'RECORDING_SAVE_START'
    }).catch(() => {});
  }
 
  try {
    // 1. Convert base64 data URL to Blob natively via fetch
    const responseBlob = await fetch(videoDataBase64);
    const videoBlob = await responseBlob.blob();

    // 2. Fetch the active workspace ID from synchronized extension storage
    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get(['loomo_active_workspace_id'], resolve);
    });
    const workspaceId = storageData.loomo_active_workspace_id || '';

    // 3. Prepare FormData
    const mediaId = generateUUID();
    const title = `Loomo Recording - ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`;
    
    const formData = new FormData();
    formData.append('file', videoBlob, `${mediaId}.webm`);
    formData.append('title', title);
    formData.append('type', 'recording');
    formData.append('durationSeconds', String(durationSec || 1));
    if (workspaceId) {
      formData.append('workspaceId', workspaceId);
    }

    // 4. Send upload request to localhost backend (attaches session cookies automatically)
    const response = await fetch('http://localhost:8999/api/media/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      let errText = 'Server upload failed';
      try {
        const errJson = await response.json();
        errText = errJson.error || errText;
      } catch (e) {}
      throw new Error(errText);
    }

    const uploadResult = await response.json();
    const serverMediaId = uploadResult.mediaId;

    // 5. Generate public share link
    const shareRes = await fetch(`http://localhost:8999/api/media/${serverMediaId}/share`, {
      method: 'POST',
      credentials: 'include'
    });

    let shareLink = 'http://localhost:8999/';
    if (shareRes.ok) {
      const shareData = await shareRes.json();
      shareLink = `http://localhost:8999/s/${shareData.shareToken}`;
    }

    // 6. Send success message to the content script
    if (targetTabId) {
      chrome.tabs.sendMessage(targetTabId, {
        source: 'jam-extension-background',
        action: 'RECORDING_SAVE_SUCCESS',
        payload: { shareLink }
      }).catch(() => {});
    }

  } catch (error) {
    console.error('[Loomo Background] Gagal menyimpan rekaman:', error);
    if (targetTabId) {
      chrome.tabs.sendMessage(targetTabId, {
        source: 'jam-extension-background',
        action: 'RECORDING_SAVE_ERROR',
        payload: { error: error.message || String(error) }
      }).catch(() => {});
    }
  }
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
