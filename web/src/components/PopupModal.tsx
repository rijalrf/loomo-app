'use client';

import { ReactNode } from 'react';

export type PopupVariant = 'confirm' | 'alert' | 'info' | 'custom';

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: PopupVariant;
  title?: string;
  message?: string | ReactNode;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  dangerous?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function PopupModal({
  isOpen,
  onClose,
  variant = 'info',
  title,
  message,
  children,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false,
  dangerous = false,
  maxWidth = 'md'
}: PopupModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }[maxWidth];

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
      onClick={handleCancel}
    >
      <div 
        className={`w-full ${maxWidthClass} bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden p-6 animate-in fade-in zoom-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
            <button 
              onClick={handleCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {message && (
          <div className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
            {message}
          </div>
        )}

        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        <div className={`flex gap-3 ${showCancel || variant === 'confirm' ? 'justify-end' : 'justify-end'}`}>
          {(showCancel || variant === 'confirm') && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-[var(--bg-hover)] border border-[var(--border-color)] text-white rounded-lg text-sm font-bold hover:bg-[var(--bg-main)] transition-all"
            >
              {cancelText}
            </button>
          )}
          
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              dangerous
                ? 'bg-[var(--error)] text-white hover:bg-[var(--error-hover)]'
                : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
