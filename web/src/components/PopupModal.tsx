'use client';

import { ReactNode, useEffect, useState } from 'react';

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function PopupModal({
  isOpen,
  onClose,
  children,
  maxWidth = 'md'
}: PopupModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }[maxWidth];

  return (
    <div 
      className={`fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-6 backdrop-blur-[12px] transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`w-full ${maxWidthClass} bg-[#1a1a1d] border border-[#3f3f46] rounded-2xl overflow-hidden p-8 relative transition-all duration-300 ${
          isClosing ? 'scale-90 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-md flex items-center justify-center text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#27272a] transition-all cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {children}
      </div>
    </div>
  );
}
