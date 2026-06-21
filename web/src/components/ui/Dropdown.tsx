'use client';

import { useRef, ReactNode } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

interface DropdownProps {
  trigger: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  align?: 'left' | 'right';
  direction?: 'up' | 'down';
  className?: string;
}

export default function Dropdown({
  trigger,
  isOpen,
  onOpenChange,
  children,
  align = 'left',
  direction = 'down',
  className = ''
}: DropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => {
    if (isOpen) {
      onOpenChange(false);
    }
  });

  return (
    <div className={`relative inline-block ${isOpen ? 'z-50' : ''} ${className}`} ref={containerRef}>
      <div onClick={() => onOpenChange(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 ${direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'} ${
            align === 'right' ? 'right-0' : 'left-0'
          } min-w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
