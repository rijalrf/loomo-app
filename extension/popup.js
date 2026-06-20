// Global error handling to log popup script errors to console
window.addEventListener('error', (event) => {
  console.error(`[popup] Unhandled Error: ${event.message} at ${event.filename}:${event.lineno}`);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error(`[popup] Unhandled Promise Rejection: ${event.reason}`);
});

function showAlert(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      max-width: 320px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #e2e8f0;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const button = document.createElement('button');
    button.textContent = 'OK';
    button.style.cssText = `
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    button.onmouseover = () => {
      button.style.background = '#2563eb';
    };
    button.onmouseout = () => {
      button.style.background = '#3b82f6';
    };

    button.onclick = () => {
      document.body.removeChild(overlay);
      resolve();
    };

    dialog.appendChild(messageEl);
    dialog.appendChild(button);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    button.focus();
  });
}

const btnAction = document.getElementById('btn-action');
const btnScreenshot = document.getElementById('btn-screenshot');
const btnDashboard = document.getElementById('btn-view-dashboard');
const statusDisplay = document.getElementById('status-display');
const statusContainer = document.getElementById('status-container');
const loginWarning = document.getElementById('login-warning');

let isRecording = false;

// 1. Periksa Sesi Login dari storage terlebih dahulu
chrome.storage.local.get(['gdrive_user_session'], (result) => {
  const session = result.gdrive_user_session;
  
  if (!session || !session.token) {
    // Belum login: Tampilkan warning dan sembunyikan tombol rekam/screenshot/dashboard
    loginWarning.style.display = 'block';
    statusContainer.style.display = 'none';
    btnAction.style.display = 'none';
    btnScreenshot.style.display = 'none';
    if (btnDashboard) btnDashboard.style.display = 'none';
  } else {
    // Sudah login: Tampilkan engine rekam
    loginWarning.style.display = 'none';
    statusContainer.style.display = 'flex';
    btnAction.style.display = 'flex';
    btnScreenshot.style.display = 'flex';
    if (btnDashboard) btnDashboard.style.display = 'flex';
    
    // Ambil status perekaman aktif saat ini dari service worker
    chrome.runtime.sendMessage(
      { source: 'jam-extension-popup', action: 'GET_STATUS' },
      (response) => {
        if (chrome.runtime.lastError) return;
        if (response) {
          isRecording = response.isRecording;
          updateUI(isRecording, response.elapsed);
        }
      }
    );
  }
});

// 2. Klik Action Button (Mulai / Hentikan Rekaman)
btnAction.addEventListener('click', async () => {
  btnAction.disabled = true;
  
  if (!isRecording) {
    // Mulai Perekaman
    chrome.runtime.sendMessage(
      { source: 'jam-extension-popup', action: 'START_RECORDING' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(`[popup] [Popup] Gagal rekam: ${chrome.runtime.lastError.message}`);
          btnAction.disabled = false;
          return;
        }
        btnAction.disabled = false;
        if (response && response.success) {
          isRecording = true;
          updateUI(true, 0);
          window.close();
        } else {
          showAlert('Failed to start recording: ' + (response?.error || 'Unknown error'));
        }
      }
    );
  } else {
    // Hentikan Perekaman
    statusDisplay.innerHTML = 'Memproses...';
    chrome.runtime.sendMessage(
      { source: 'jam-extension-popup', action: 'STOP_RECORDING' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(`[popup] [Popup] Gagal stop: ${chrome.runtime.lastError.message}`);
          btnAction.disabled = false;
          return;
        }
        btnAction.disabled = false;
        if (response && response.success) {
          isRecording = false;
          updateUI(false, 0);
          window.close();
        } else {
          showAlert('Failed to stop recording: ' + (response?.error || 'Unknown error'));
        }
      }
    );
  }
});

// 2b. Klik Screenshot Button (Mulai Screenshot Area)
btnScreenshot.addEventListener('click', () => {
  chrome.runtime.sendMessage(
    { source: 'jam-extension-popup', action: 'START_SCREENSHOT' },
    (response) => {
      if (chrome.runtime.lastError) {
        showAlert('Failed to initialize screenshot: ' + chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        window.close();
      } else {
        showAlert('Failed to initialize screenshot: ' + (response?.error || 'Unknown error'));
      }
    }
  );
});

// 3. Klik Buka Backoffice
btnDashboard.addEventListener('click', () => {
  chrome.tabs.create({ url: `${globalThis.LoomoConfig.API_BASE_URL}/` });
});

// 3c. Klik Sign In Google
const btnLoginGoogle = document.getElementById('btn-login-google');
if (btnLoginGoogle) {
  btnLoginGoogle.addEventListener('click', () => {
    chrome.tabs.create({ url: `${globalThis.LoomoConfig.API_BASE_URL}/api/auth/google` });
  });
}

// Copy logs function removed

// 4. Helper Update UI dengan Feather Icons (Inline SVG)
function updateUI(recording, elapsed) {
  const statusDot = document.getElementById('status-dot');
  
  if (recording) {
    statusDisplay.textContent = `MEREKAM (${elapsed}s)`;
    statusDot.className = 'status-dot recording';
    
    // Feather Icon: square (Hentikan)
    btnAction.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="feather feather-square"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
      <span>Hentikan & Simpan</span>
    `;
    btnAction.className = 'btn btn-stop';
    btnScreenshot.style.display = 'none';
  } else {
    statusDisplay.textContent = 'Active';
    statusDot.className = 'status-dot';
    
    // Feather Icon: video (Mulai)
    btnAction.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="feather feather-video"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
      <span>Rekam Layar Tab</span>
    `;
    btnAction.className = 'btn btn-record';
    btnScreenshot.style.display = 'flex';
  }
}
