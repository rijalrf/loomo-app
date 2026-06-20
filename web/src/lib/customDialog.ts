export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const button = document.createElement('button');
    button.textContent = 'OK';
    button.style.cssText = `
      background: #06b6d4;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    button.onmouseover = () => {
      button.style.background = '#0891b2';
    };
    button.onmouseout = () => {
      button.style.background = '#06b6d4';
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
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #a1a1aa;
      font-size: 14px;
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
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      background: #1a1a1d;
      color: white;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    cancelButton.onmouseover = () => {
      cancelButton.style.background = '#0a0a0b';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.background = '#1a1a1d';
    };

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.style.cssText = `
      background: #EF4444;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    confirmButton.onmouseover = () => {
      confirmButton.style.background = '#DC2626';
    };
    confirmButton.onmouseout = () => {
      confirmButton.style.background = '#EF4444';
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
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #111113;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      color: #a1a1aa;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.style.cssText = `
      width: 100%;
      background: #0a0a0b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 14px;
      color: #fafafa;
      margin-bottom: 20px;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-sizing: border-box;
      transition: all 0.2s;
    `;

    input.onfocus = () => {
      input.style.borderColor = '#06b6d4';
      input.style.background = '#111113';
    };
    input.onblur = () => {
      input.style.borderColor = '#27272a';
      input.style.background = '#0a0a0b';
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      background: #1a1a1d;
      color: white;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    cancelButton.onmouseover = () => {
      cancelButton.style.background = '#0a0a0b';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.background = '#1a1a1d';
    };

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
      background: #06b6d4;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    okButton.onmouseover = () => {
      okButton.style.background = '#0891b2';
    };
    okButton.onmouseout = () => {
      okButton.style.background = '#06b6d4';
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
