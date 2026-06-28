import { useState, useMemo } from 'react';

interface Media {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  uploadedBy: string;
  title: string;
  description?: string | null;
  type: 'SCREENSHOT' | 'RECORDING';
  driveThumbnailUrl: string | null;
  shareToken: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
  uploadStatus: 'PROCESSING' | 'UPLOADING' | 'READY' | 'FAILED' | 'DELETING';
  durationSeconds: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploader: {
    displayName: string;
    avatarUrl: string | null;
  };
}

type FilterType = 'ALL' | 'SCREENSHOT' | 'RECORDING';
type FilterStatus = 'ALL' | 'READY' | 'PROCESSING' | 'FAILED';
type FilterVisibility = 'ALL' | 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY';
type SortBy = 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'SIZE_DESC';

interface UseMediaFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  filterVisibility: FilterVisibility;
  setFilterVisibility: (visibility: FilterVisibility) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  page: number;
  setPage: (page: number) => void;
  sortedMedia: Media[];
}

export function useMediaFilters(mediaList: Media[]): UseMediaFiltersReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterVisibility, setFilterVisibility] = useState<FilterVisibility>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('DATE_DESC');
  const [page, setPage] = useState(1);

  const sortedMedia = useMemo(() => {
    return [...mediaList].sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'NAME_ASC') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'SIZE_DESC') {
        return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
      }
      return 0;
    });
  }, [mediaList, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterVisibility,
    setFilterVisibility,
    sortBy,
    setSortBy,
    page,
    setPage,
    sortedMedia
  };
}
