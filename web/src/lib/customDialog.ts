export function showAlert(message: string): Promise<void> {
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
      background: #0f0d0c;
      border: 1px solid #2b2725;
      border-radius: 6px;
      padding: 20px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
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
      background: #cc5200;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(204, 82, 0, 0.15);
    `;

    button.onmouseover = () => {
      button.style.background = '#b34700';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 8px 20px rgba(204, 82, 0, 0.25)';
    };
    button.onmouseout = () => {
      button.style.background = '#cc5200';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(204, 82, 0, 0.15)';
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
      background: rgba(15, 23, 42, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #0f0d0c;
      border: 1px solid #2b2725;
      border-radius: 6px;
      padding: 20px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
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

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      color: #F8FAFC;
      border: 1px solid #2b2725;
      border-radius: 4px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    cancelButton.onmouseover = () => {
      cancelButton.style.background = '#0f0d0c';
      cancelButton.style.borderColor = '#cc5200';
      cancelButton.style.color = 'white';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.background = 'rgba(255, 255, 255, 0.05)';
      cancelButton.style.borderColor = '#272526';
      cancelButton.style.color = '#F8FAFC';
    };

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.style.cssText = `
      background: #EF4444;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    confirmButton.onmouseover = () => {
      confirmButton.style.background = '#DC2626';
      confirmButton.style.transform = 'translateY(-1px)';
    };
    confirmButton.onmouseout = () => {
      confirmButton.style.background = '#EF4444';
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
      background: rgba(15, 23, 42, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #0f0d0c;
      border: 1px solid #2b2725;
      border-radius: 6px;
      padding: 20px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
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
      margin-bottom: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.style.cssText = `
      width: 100%;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid #2b2725;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 14px;
      color: #F8FAFC;
      margin-bottom: 20px;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-sizing: border-box;
      transition: all 0.2s;
    `;

    input.onfocus = () => {
      input.style.borderColor = '#cc5200';
      input.style.boxShadow = '0 0 0 1px #cc5200';
      input.style.background = 'rgba(30, 41, 59, 0.8)';
    };
    input.onblur = () => {
      input.style.borderColor = '#272526';
      input.style.boxShadow = 'none';
      input.style.background = 'rgba(30, 41, 59, 0.6)';
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      color: #F8FAFC;
      border: 1px solid #2b2725;
      border-radius: 4px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    cancelButton.onmouseover = () => {
      cancelButton.style.background = '#0f0d0c';
      cancelButton.style.borderColor = '#cc5200';
      cancelButton.style.color = 'white';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.background = 'rgba(255, 255, 255, 0.05)';
      cancelButton.style.borderColor = '#272526';
      cancelButton.style.color = '#F8FAFC';
    };

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
      background: #cc5200;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(204, 82, 0, 0.15);
    `;

    okButton.onmouseover = () => {
      okButton.style.background = '#b34700';
      okButton.style.transform = 'translateY(-2px)';
      okButton.style.boxShadow = '0 8px 20px rgba(204, 82, 0, 0.25)';
    };
    okButton.onmouseout = () => {
      okButton.style.background = '#cc5200';
      okButton.style.transform = 'translateY(0)';
      okButton.style.boxShadow = '0 4px 12px rgba(204, 82, 0, 0.15)';
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
