'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Dropdown from './Dropdown';

interface MediaVisibilitySelectProps {
  value: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
  onChange: (value: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => void;
  direction?: 'up' | 'down';
}

const options = {
  PRIVATE: { label: 'Private', color: 'bg-[var(--text-muted)]' },
  UNLISTED: { label: 'Public', color: 'bg-[var(--primary)]' },
  WORKSPACE_ONLY: { label: 'Workspace', color: 'bg-[var(--secondary)]' }
};

export default function MediaVisibilitySelect({
  value,
  onChange,
  direction = 'down'
}: MediaVisibilitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = options[value];

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="flex items-center gap-1.5 bg-transparent text-xs font-bold text-[var(--text-muted)] outline-none cursor-pointer hover:text-white transition-all"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${current.color}`}></span>
          <span>{current.label}</span>
          <ChevronDown size={14} className="text-[var(--text-muted)]" />
        </button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      direction={direction}
      className="inline-block"
    >
      <div className="w-32">
        {(Object.keys(options) as Array<keyof typeof options>).map((optKey) => {
          const opt = options[optKey];
          return (
            <button
              key={optKey}
              type="button"
              onClick={() => {
                onChange(optKey);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                optKey === value
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${opt.color}`}></span>
              <span className="flex-1 text-left">{opt.label}</span>
              {optKey === value && (
                <Check size={14} className="text-[var(--primary)]" />
              )}
            </button>
          );
        })}
      </div>
    </Dropdown>
  );
}
