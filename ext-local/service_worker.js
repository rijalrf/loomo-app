import './config.js';

// Global error handling to log background service worker errors to console
self.addEventListener('error', (event) => {
  console.error(`[background] Unhandled error: ${event.message} at ${event.filename}:${event.lineno}`);
});
self.addEventListener('unhandledrejection', (event) => {
  console.error(`[background] Unhandled promise rejection: ${event.reason}`);
});

// State Perekaman Global di Background
let isRecording = false;
let isPaused = false;
let startTime = 0;
let accumulatedTime = 0;
let finalDuration = 0;
let activeTabId = null;

let logs = [];
let networkRequests = [];
let userActions = [];

// Helper untuk sinkronisasi state ke storage (mengatasi service worker inactivity/idle termination)
function withRecordingState(callback) {
  chrome.storage.local.get([
    'rec_isRecording',
    'rec_isPaused',
    'rec_startTime',
    'rec_accumulatedTime',
    'rec_finalDuration',
    'rec_activeTabId',
    'rec_logs',
    'rec_networkRequests',
    'rec_userActions'
  ], (res) => {
    isRecording = !!res.rec_isRecording;
    isPaused = !!res.rec_isPaused;
    startTime = res.rec_startTime || 0;
    accumulatedTime = res.rec_accumulatedTime || 0;
    finalDuration = res.rec_finalDuration || 0;
    activeTabId = res.rec_activeTabId || null;
    logs = res.rec_logs || [];
    networkRequests = res.rec_networkRequests || [];
    userActions = res.rec_userActions || [];
    callback();
  });
}

function updateRecordingState(cb) {
  chrome.storage.local.set({
    rec_isRecording: isRecording,
    rec_isPaused: isPaused,
    rec_startTime: startTime,
    rec_accumulatedTime: accumulatedTime,
    rec_finalDuration: finalDuration,
    rec_activeTabId: activeTabId,
    rec_logs: logs,
    rec_networkRequests: networkRequests,
    rec_userActions: userActions
  }, () => {
    if (cb) cb();
  });
}

function clearRecordingState(cb) {
  isRecording = false;
  isPaused = false;
  startTime = 0;
  accumulatedTime = 0;
  finalDuration = 0;
  activeTabId = null;
  logs = [];
  networkRequests = [];
  userActions = [];
  chrome.storage.local.remove([
    'rec_isRecording',
    'rec_isPaused',
    'rec_startTime',
    'rec_accumulatedTime',
    'rec_finalDuration',
    'rec_activeTabId',
    'rec_logs',
    'rec_networkRequests',
    'rec_userActions'
  ], () => {
    if (cb) cb();
  });
}

// Mendengarkan pesan dari Content Script, Popup, dan Offscreen Document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Jembatan Penulisan Log Fisik removed

  // Handle closing the current popup/window
  if (message.action === 'CLOSE_CURRENT_WINDOW') {
    if (sender && sender.tab && typeof sender.tab.windowId !== 'undefined') {
      chrome.windows.remove(sender.tab.windowId);
    }
    return false;
  }

  // 1. Log Penyadapan Halaman Target (dari content.js)
  if (message.source === 'jam-extension-content') {
    if (message.type === 'CONSOLE_LOG' || message.type === 'NETWORK_REQUEST' || message.type === 'USER_ACTION') {
      withRecordingState(() => {
        if (isRecording) {
          if (message.type === 'CONSOLE_LOG') {
            logs.push(message.payload);
          } else if (message.type === 'NETWORK_REQUEST') {
            networkRequests.push(message.payload);
          } else if (message.type === 'USER_ACTION') {
            userActions.push(message.payload);
          }
          updateRecordingState();
        }
      });
      return false; // non-blocking logging
    }
  }

  // 2. Instruksi Kontrol dari Popup (popup.js) atau Content Script (floating control bar)
  if (message.source === 'jam-extension-popup' || message.source === 'jam-extension-content') {
    if (message.action === 'START_RECORDING') {
      let targetTabId = message.payload?.tabId;
      if (!targetTabId && sender && sender.tab) {
        targetTabId = sender.tab.id;
      }
      if (!targetTabId) {
        sendResponse({ success: false, error: 'Target tab ID not found.' });
        return false;
      }
      chrome.tabCapture.getMediaStreamId({ targetTabId: targetTabId }, (streamId) => {
        if (chrome.runtime.lastError) {
          console.warn('Gagal mengambil streamId tabCapture:', chrome.runtime.lastError.message);
          startRecordingFlow(targetTabId, null, sendResponse);
        } else {
          startRecordingFlow(targetTabId, streamId, sendResponse);
        }
      });
      return true; // async response
    } else if (message.action === 'STOP_RECORDING') {
      withRecordingState(() => {
        stopRecordingFlow(sendResponse);
      });
      return true; // async response
    } else if (message.action === 'PAUSE_RECORDING') {
      withRecordingState(() => {
        if (isRecording && !isPaused) {
          accumulatedTime += (Date.now() - startTime);
          isPaused = true;
          updateRecordingState(() => {
            chrome.runtime.sendMessage({
              source: 'jam-extension-background',
              action: 'PAUSE_OFFSCREEN_CAPTURE'
            });
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: false, error: 'Cannot pause: not recording or already paused.' });
        }
      });
      return true;
    } else if (message.action === 'RESUME_RECORDING') {
      withRecordingState(() => {
        if (isRecording && isPaused) {
          startTime = Date.now();
          isPaused = false;
          updateRecordingState(() => {
            chrome.runtime.sendMessage({
              source: 'jam-extension-background',
              action: 'RESUME_OFFSCREEN_CAPTURE'
            });
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: false, error: 'Cannot resume: not paused.' });
        }
      });
      return true;
    } else if (message.action === 'GET_STATUS') {
      withRecordingState(() => {
        let elapsed = 0;
        if (isRecording) {
          if (isPaused) {
            elapsed = Math.round(accumulatedTime / 1000);
          } else {
            elapsed = Math.round((accumulatedTime + (Date.now() - startTime)) / 1000);
          }
        }
        const senderTabId = (sender && sender.tab) ? sender.tab.id : null;
        const isCurrentTabRecording = isRecording && (senderTabId === activeTabId);
        sendResponse({ isRecording, isCurrentTabRecording, isPaused, elapsed });
      });
      return true;
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
              files: ['content.js']
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
              console.error(`[background] [Jam Extension] captureVisibleTab error: ${chrome.runtime.lastError.message}`);
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
        const backofficeUrl = `${globalThis.LoomoConfig.API_BASE_URL}/editor?id=${metadata.id}&isPopup=true`;
        createCenteredEditorWindow(backofficeUrl);
      });
    }
  }

  // 3. Terima Video Blob dari Offscreen Document (offscreen.js) via Storage
  if (message.source === 'jam-extension-offscreen' && message.action === 'VIDEO_BLOB_READY_IN_STORAGE') {
    withRecordingState(() => {
      chrome.storage.local.get(['pending_video_blob'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('[background] Gagal mengambil pending_video_blob dari storage:', chrome.runtime.lastError.message);
          return;
        }
        const videoBase64 = result.pending_video_blob;
        chrome.storage.local.remove('pending_video_blob');
        if (videoBase64) {
          saveRecordingAndRedirect(videoBase64);
        } else {
          console.error('[background] pending_video_blob kosong di storage.');
        }
      });
    });
    return false;
  }

  // 3b. Menerima request upload latar belakang dari content script
  if (message.action === 'BACKGROUND_UPLOAD_START') {
    const { mediaId, uploadUrl, blob, id, title } = message.payload;
    performBackgroundUpload(mediaId, uploadUrl, blob, id, title);
    sendResponse({ success: true });
    return false;
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
async function startRecordingFlow(targetTabId, streamId, sendResponse) {
  try {
    activeTabId = targetTabId;
    isRecording = true;
    isPaused = false;
    startTime = Date.now();
    accumulatedTime = 0;
    finalDuration = 0;
    logs = [];
    networkRequests = [];
    userActions = [];

    updateRecordingState(async () => {
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

      // D. Buat offscreen document untuk merekam video (karena worker Manifest V3 tidak punya DOM API)
      await createOffscreenDocument();

      // E. Beri tahu offscreen untuk mulai menangkap
      chrome.runtime.sendMessage({
        source: 'jam-extension-background',
        action: 'START_OFFSCREEN_CAPTURE',
        payload: { streamId }
      });

      sendResponse({ success: true });
    });
  } catch (err) {
    console.error(`[background] Gagal memulai alur perekaman: ${err.message || String(err)}`);
    clearRecordingState(() => {
      sendResponse({ success: false, error: err.message });
    });
  }
}

// Menghentikan Perekaman
async function stopRecordingFlow(sendResponse) {
  if (!isRecording) {
    sendResponse({ success: false, error: 'Perekaman tidak aktif.' });
    return;
  }

  if (isPaused) {
    finalDuration = Math.round(accumulatedTime / 1000);
  } else {
    finalDuration = Math.round((accumulatedTime + (Date.now() - startTime)) / 1000);
  }

  updateRecordingState(async () => {
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

    sendResponse({ success: true });
  });
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
function createCenteredEditorWindow(url) {
  chrome.windows.getLastFocused((win) => {
    let winWidth = 1280;
    let winHeight = 720;
    let left = 100;
    let top = 100;
    if (win && typeof win.width === 'number' && typeof win.height === 'number') {
      winWidth = Math.min(1600, Math.round(win.width * 0.9));
      winHeight = Math.min(960, Math.round(win.height * 0.9));
      left = Math.round((win.width - winWidth) / 2 + (win.left || 0));
      top = Math.round((win.height - winHeight) / 2 + (win.top || 0));
    }
    chrome.windows.create({
      url,
      type: 'popup',
      width: winWidth,
      height: winHeight,
      left: Math.max(0, left),
      top: Math.max(0, top)
    }, (newWin) => {
      if (chrome.runtime.lastError) {
        console.warn('Gagal membuat centered window, mencoba fallback:', chrome.runtime.lastError.message);
        chrome.windows.create({
          url,
          type: 'popup'
        });
      }
    });
  });
}

async function saveRecordingAndRedirect(videoDataBase64) {
  // A. Hapus offscreen document karena perekaman selesai
  chrome.offscreen.closeDocument().catch(() => {});
  
  const durationSec = finalDuration || 1;
 
  // B. Susun objek Metadata Jam
  const metadata = {
    id: generateUUID(),
    title: `Loomo Recording - ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`,
    createdAt: new Date().toISOString(),
    type: 'recording', // Tipe: Recording
    duration: durationSec || 1,
    systemInfo: {
      browser: 'Google Chrome (Extension)',
      os: 'Linux',
      userAgent: 'Chrome Extension',
      screenResolution: '1920x1080', // Default fallback
      viewportSize: '1280x720',
      locale: 'id-ID'
    },
    logs: logs,
    networkRequests: networkRequests,
    userActions: userActions
  };
 
  // C. Simpan sementara di chrome.storage.local agar bisa dibaca halaman Loomo
  chrome.storage.local.set({
    pending_jam_metadata: metadata,
    pending_jam_video: videoDataBase64
  }, () => {
    clearRecordingState(() => {
      const backofficeUrl = `${globalThis.LoomoConfig.API_BASE_URL}/editor?id=${metadata.id}&isPopup=true`;
      createCenteredEditorWindow(backofficeUrl);
    });
  });
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

async function performBackgroundUpload(mediaId, uploadUrl, blob, id, title) {
  console.log('[background] Starting background upload to Google Drive for:', title, 'Media ID:', mediaId);
  
  try {
    // 1. Upload directly to Google Drive (PUT request)
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': blob.type || 'video/webm'
      }
    });

    if (!uploadRes.ok) {
      throw new Error(`Google Drive upload failed: ${uploadRes.statusText}`);
    }

    const gMetadata = await uploadRes.json();
    const driveFileId = gMetadata.id;
    console.log('[background] Google Drive upload success, file ID:', driveFileId);

    // 2. Finalize on server
    const completeRes = await fetch(`${globalThis.LoomoConfig.API_BASE_URL}/api/media/upload/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mediaId,
        driveFileId,
        fileSize: blob.size
      })
    });

    if (!completeRes.ok) {
      const errText = await completeRes.text();
      throw new Error(`Failed to finalize upload on server: ${errText}`);
    }

    console.log('[background] Background upload successfully finalized for:', title);

    // 3. Show System Notification (CORS/Permissions allowed)
    chrome.notifications.create(mediaId, {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Loomo - Upload Sukses!',
      message: `Video "${title}" berhasil di-upload ke Google Drive.`,
      priority: 2
    });

  } catch (err) {
    console.error('[background] Background upload error:', err.message || err);
    
    // Show Error Notification
    chrome.notifications.create(mediaId, {
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Loomo - Upload Gagal',
      message: `Gagal mengunggah video "${title}": ${err.message || String(err)}`,
      priority: 2
    });
  }
}
