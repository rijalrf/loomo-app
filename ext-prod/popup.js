// Global error handling to log popup script errors to console
window.addEventListener('error', (event) => {
  console.error(`[popup] Unhandled Error: ${event.message} at ${event.filename}:${event.lineno}`);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error(`[popup] Unhandled Promise Rejection: ${event.reason}`);
});

// Set Environment Label
document.addEventListener('DOMContentLoaded', () => {
  const envLabelElement = document.getElementById('environment-label');
  if (envLabelElement) {
    const baseUrl = globalThis.LoomoConfig.API_BASE_URL;
    let label = '';
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      label = '- Local';
    } else if (baseUrl.includes('qa.loomo.my.id')) {
      label = '- QA';
    }
    envLabelElement.textContent = label;
  }
});
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
      background: rgba(15, 23, 42, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      max-width: 320px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(12, 178, 235, 0.3);
    `;

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #F8FAFC;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const button = document.createElement('button');
    button.textContent = 'OK';
    button.style.cssText = `
      background: #0CB2EB;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(12, 178, 235, 0.25);
    `;

    button.onmouseover = () => {
      button.style.background = '#0aa1d6';
      button.style.boxShadow = '0 8px 20px rgba(12, 178, 235, 0.4)';
    };
    button.onmouseout = () => {
      button.style.background = '#0CB2EB';
      button.style.boxShadow = '0 4px 12px rgba(12, 178, 235, 0.25)';
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
    statusDisplay.innerHTML = 'Processing...';
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
    statusDisplay.textContent = `RECORDING (${elapsed}s)`;
    statusDot.className = 'status-dot recording';
    
    // Feather Icon: square (Hentikan)
    btnAction.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="feather feather-square"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
      <span>Stop & Save</span>
    `;
    btnAction.className = 'btn btn-stop';
    btnScreenshot.style.display = 'none';
  } else {
    statusDisplay.textContent = 'Active';
    statusDot.className = 'status-dot';
    
    // Feather Icon: video (Mulai)
    btnAction.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="feather feather-video"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
      <span>Record Screen</span>
    `;
    btnAction.className = 'btn btn-record';
    btnScreenshot.style.display = 'flex';
  }
}
