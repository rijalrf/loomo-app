export function showAlert(message: string): Promise<void> {
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
      backdrop-filter: blur(4px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.2s ease-out;
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
      color: #e2e8f0;
      font-size: 15px;
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
      button.style.transform = 'translateY(-1px)';
    };
    button.onmouseout = () => {
      button.style.background = '#3b82f6';
      button.style.transform = 'translateY(0)';
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

export function showConfirm(message: string): Promise<boolean> {
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
      backdrop-filter: blur(4px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.2s ease-out;
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
      color: #e2e8f0;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Batal';
    cancelButton.style.cssText = `
      background: #475569;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    cancelButton.onmouseover = () => {
      cancelButton.style.background = '#334155';
      cancelButton.style.transform = 'translateY(-1px)';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.background = '#475569';
      cancelButton.style.transform = 'translateY(0)';
    };

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Ya';
    confirmButton.style.cssText = `
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    confirmButton.onmouseover = () => {
      confirmButton.style.background = '#dc2626';
      confirmButton.style.transform = 'translateY(-1px)';
    };
    confirmButton.onmouseout = () => {
      confirmButton.style.background = '#ef4444';
      confirmButton.style.transform = 'translateY(0)';
    };

    const cleanup = () => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    };

    cancelButton.onclick = () => {
      cleanup();
      resolve(false);
    };

    confirmButton.onclick = () => {
      cleanup();
      resolve(true);
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    cancelButton.focus();
  });
}

export function showPrompt(message: string, defaultValue = ''): Promise<string | null> {
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
      backdrop-filter: blur(4px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      animation: slideIn 0.2s ease-out;
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
      color: #e2e8f0;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.style.cssText = `
      width: 100%;
      background: #0f172a;
      border: 1px solid #475569;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      color: #e2e8f0;
      margin-bottom: 20px;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-sizing: border-box;
    `;

    input.onfocus = () => {
      input.style.borderColor = '#3b82f6';
    };
    input.onblur = () => {
      input.style.borderColor = '#475569';
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Batal';
    cancelButton.style.cssText = `
      background: #475569;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    cancelButton.onmouseover = () => {
      cancelButton.style.background = '#334155';
      cancelButton.style.transform = 'translateY(-1px)';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.background = '#475569';
      cancelButton.style.transform = 'translateY(0)';
    };

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    okButton.onmouseover = () => {
      okButton.style.background = '#2563eb';
      okButton.style.transform = 'translateY(-1px)';
    };
    okButton.onmouseout = () => {
      okButton.style.background = '#3b82f6';
      okButton.style.transform = 'translateY(0)';
    };

    const cleanup = () => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    };

    cancelButton.onclick = () => {
      cleanup();
      resolve(null);
    };

    okButton.onclick = () => {
      cleanup();
      resolve(input.value);
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        cleanup();
        resolve(input.value);
      } else if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };

    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(okButton);
    dialog.appendChild(messageEl);
    dialog.appendChild(input);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    input.focus();
    input.select();
  });
}
