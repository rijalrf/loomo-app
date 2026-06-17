// Global error handling to log popup script errors to server
window.addEventListener('error', (event) => {
  try {
    chrome.runtime.sendMessage({
      action: 'WRITE_LOG_TO_SERVER',
      payload: { level: 'error', context: 'popup', message: `Unhandled Error: ${event.message} at ${event.filename}:${event.lineno}` }
    });
  } catch (e) {}
});
window.addEventListener('unhandledrejection', (event) => {
  try {
    chrome.runtime.sendMessage({
      action: 'WRITE_LOG_TO_SERVER',
      payload: { level: 'error', context: 'popup', message: `Unhandled Promise Rejection: ${event.reason}` }
    });
  } catch (e) {}
});

const btnAction = document.getElementById('btn-action');
const btnScreenshot = document.getElementById('btn-screenshot');
const btnDashboard = document.getElementById('btn-view-dashboard');
const btnCopyLogs = document.getElementById('btn-copy-logs');
const statusDisplay = document.getElementById('status-display');
const statusContainer = document.getElementById('status-container');
const loginWarning = document.getElementById('login-warning');

let isRecording = false;

// 1. Periksa Sesi Login dari storage terlebih dahulu
chrome.storage.local.get(['gdrive_user_session'], (result) => {
  const session = result.gdrive_user_session;
  
  if (!session || !session.token) {
    // Belum login: Tampilkan warning dan sembunyikan tombol rekam/screenshot/dashboard/copy-logs
    loginWarning.style.display = 'block';
    statusContainer.style.display = 'none';
    btnAction.style.display = 'none';
    btnScreenshot.style.display = 'none';
    if (btnDashboard) btnDashboard.style.display = 'none';
    if (btnCopyLogs) btnCopyLogs.style.display = 'none';
  } else {
    // Sudah login: Tampilkan engine rekam
    loginWarning.style.display = 'none';
    statusContainer.style.display = 'flex';
    btnAction.style.display = 'flex';
    btnScreenshot.style.display = 'flex';
    if (btnDashboard) btnDashboard.style.display = 'flex';
    if (btnCopyLogs) btnCopyLogs.style.display = 'none';
    
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
          ExtensionLogger.error('popup', `[Popup] Gagal rekam: ${chrome.runtime.lastError.message}`);
          btnAction.disabled = false;
          return;
        }
        btnAction.disabled = false;
        if (response && response.success) {
          isRecording = true;
          updateUI(true, 0);
          window.close();
        } else {
          alert('Gagal merekam: ' + (response?.error || 'Kesalahan tidak diketahui'));
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
          ExtensionLogger.error('popup', `[Popup] Gagal stop: ${chrome.runtime.lastError.message}`);
          btnAction.disabled = false;
          return;
        }
        btnAction.disabled = false;
        if (response && response.success) {
          isRecording = false;
          updateUI(false, 0);
          window.close();
        } else {
          alert('Gagal menghentikan: ' + (response?.error || 'Kesalahan tidak diketahui'));
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
        alert('Gagal menginisialisasi screenshot: ' + chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        window.close();
      } else {
        alert('Gagal menginisialisasi screenshot: ' + (response?.error || 'Kesalahan tidak diketahui'));
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

// 3b. Klik Salin Log Diagnostik
if (btnCopyLogs) {
  btnCopyLogs.addEventListener('click', async () => {
    btnCopyLogs.disabled = true;
    try {
      const logs = await ExtensionLogger.getLogs();
      if (logs.length === 0) {
        alert('Belum ada log diagnostik tercatat.');
        btnCopyLogs.disabled = false;
        return;
      }
      
      await navigator.clipboard.writeText(logs.join('\n'));
      
      const originalText = btnCopyLogs.innerHTML;
      btnCopyLogs.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Tersalin!
      `;
      btnCopyLogs.style.color = '#10B981';
      setTimeout(() => {
        btnCopyLogs.innerHTML = originalText;
        btnCopyLogs.style.color = '#64748B';
        btnCopyLogs.disabled = false;
      }, 2000);
    } catch (err) {
      alert('Gagal menyalin log: ' + err.message);
      btnCopyLogs.disabled = false;
    }
  });
}

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
