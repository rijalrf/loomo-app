'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Dropdown from './ui/Dropdown';

export interface SelectOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

export default function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  size = 'sm',
  align = 'left'
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(o => o.value === value);

  const py = size === 'sm' ? 'py-2' : 'py-2.5';
  const px = size === 'sm' ? 'px-3' : 'px-4';
  const text = size === 'sm' ? 'text-sm' : 'text-sm';
  const rounded = 'rounded-lg';

  const defaultBtnClass = `w-full flex items-center justify-between gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-slate-300 hover:text-white ${px} ${py} ${rounded} ${text} font-semibold outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all cursor-pointer`;

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className={buttonClassName || defaultBtnClass}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={size === 'sm' ? 14 : 16}
            className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      }
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      align={align}
      className={className}
    >
      <div className="max-h-60 overflow-y-auto custom-scrollbar min-w-full w-max max-w-[280px]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg text-sm transition-colors cursor-pointer ${
              option.value === value
                ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-bold'
                : 'text-slate-400 hover:bg-[var(--bg-hover)] hover:text-white'
            }`}
          >
            {option.icon}
            <span className="flex-1 truncate">{option.label}</span>
            {option.value === value && (
              <Check size={14} className="text-[var(--primary)] shrink-0" />
            )}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}
