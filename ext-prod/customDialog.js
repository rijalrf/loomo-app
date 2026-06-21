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
      backdrop-filter: blur(8px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #1E293B;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 1px rgba(12, 178, 235, 0.3);
      animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #F8FAFC;
      font-size: 15px;
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
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 8px 20px rgba(12, 178, 235, 0.4)';
    };
    button.onmouseout = () => {
      button.style.background = '#0CB2EB';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(12, 178, 235, 0.25)';
    };

    button.onclick = () => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
      resolve();
    };

    dialog.appendChild(messageEl);
    dialog.appendChild(button);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    button.focus();
  });
}

window.showAlert = showAlert;
