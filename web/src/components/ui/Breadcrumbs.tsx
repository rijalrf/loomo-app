'use client';

import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-xs font-bold">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-slate-600 font-medium">&gt;</span>
          )}
          {item.href || item.onClick ? (
            <span
              className={`cursor-pointer transition-colors ${
                item.active
                  ? 'text-[var(--primary)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => {
                if (item.onClick) item.onClick();
                else if (item.href) router.push(item.href);
              }}
            >
              {item.label}
            </span>
          ) : (
            <span className={item.active ? 'text-[var(--primary)] font-bold' : 'text-slate-500'}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
