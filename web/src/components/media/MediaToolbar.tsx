'use client';

import { Search, Folder, Image as ImageIcon, Video, LayoutGrid, List, Eye, EyeOff, Users } from 'lucide-react';
import CustomSelect from '../CustomSelect';

interface MediaToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: 'ALL' | 'SCREENSHOT' | 'RECORDING';
  onFilterTypeChange: (type: 'ALL' | 'SCREENSHOT' | 'RECORDING') => void;
  filterStatus: 'ALL' | 'READY' | 'PROCESSING' | 'FAILED';
  onFilterStatusChange: (status: 'ALL' | 'READY' | 'PROCESSING' | 'FAILED') => void;
  filterVisibility: 'ALL' | 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
  onFilterVisibilityChange: (visibility: 'ALL' | 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') => void;
  sortBy: 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'SIZE_DESC';
  onSortChange: (sort: 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'SIZE_DESC') => void;
  isGridView: boolean;
  onViewToggle: (isGrid: boolean) => void;
  onPageChange: (page: number) => void;
}

export default function MediaToolbar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  filterVisibility,
  onFilterVisibilityChange,
  sortBy,
  onSortChange,
  isGridView,
  onViewToggle,
  onPageChange
}: MediaToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-5 w-full">
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            type="text"
            placeholder="Search captures..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-white pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
          />
        </div>

        <CustomSelect
          value={filterType}
          onChange={(val) => {
            onFilterTypeChange(val as any);
            onPageChange(1);
          }}
          options={[
            { value: 'ALL', label: 'All Types', icon: <Folder size={16} className="text-[var(--text-muted)]" /> },
            { value: 'SCREENSHOT', label: 'Screenshots', icon: <ImageIcon size={16} className="text-[var(--primary)]" /> },
            { value: 'RECORDING', label: 'Recordings', icon: <Video size={16} className="text-[var(--secondary)]" /> }
          ]}
          className="w-full sm:w-auto"
        />

        <CustomSelect
          value={filterStatus}
          onChange={(val) => {
            onFilterStatusChange(val as any);
            onPageChange(1);
          }}
          options={[
            { value: 'ALL', label: 'Any Status', icon: <Folder size={16} className="text-[var(--text-muted)]" /> },
            { value: 'READY', label: 'Ready', icon: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> },
            { value: 'PROCESSING', label: 'Processing', icon: <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" /> },
            { value: 'FAILED', label: 'Failed', icon: <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> }
          ]}
          className="w-full sm:w-auto"
        />

        <CustomSelect
          value={filterVisibility}
          onChange={(val) => {
            onFilterVisibilityChange(val as any);
            onPageChange(1);
          }}
          options={[
            { value: 'ALL', label: 'All Visibility', icon: <Folder size={16} className="text-[var(--text-muted)]" /> },
            { value: 'PRIVATE', label: 'Private', icon: <EyeOff size={16} className="text-[var(--text-muted)]" /> },
            { value: 'UNLISTED', label: 'Public', icon: <Eye size={16} className="text-[var(--text-muted)]" /> },
            { value: 'WORKSPACE_ONLY', label: 'Workspace Only', icon: <Users size={16} className="text-[var(--text-muted)]" /> }
          ]}
          className="w-full sm:w-auto"
        />
      </div>

      <div className="flex items-center gap-3 w-full lg:w-auto">
        <CustomSelect
          value={sortBy}
          onChange={(val) => onSortChange(val as any)}
          options={[
            { value: 'DATE_DESC', label: 'Recently Captured' },
            { value: 'DATE_ASC', label: 'Oldest First' },
            { value: 'NAME_ASC', label: 'Name (A-Z)' },
            { value: 'SIZE_DESC', label: 'File Size' }
          ]}
          className="w-full lg:w-auto flex-1 lg:flex-none"
        />

        <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-1 shrink-0">
          <button
            onClick={() => onViewToggle(true)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${isGridView ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
            title="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => onViewToggle(false)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isGridView ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
