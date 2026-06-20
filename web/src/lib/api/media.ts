import { fetcher } from './fetcher';

export const mediaApi = {
  rename: (id: string, title: string) =>
    fetcher(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    }),

  delete: (id: string) =>
    fetcher(`/api/media/${id}`, { method: 'DELETE' }),

  updateVisibility: (id: string, visibility: 'PRIVATE' | 'UNLISTED' | 'WORKSPACE_ONLY') =>
    fetcher(`/api/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility })
    }),

  createShareLink: (id: string) =>
    fetcher(`/api/media/${id}/share`, { method: 'POST' }),

  revokeShareLink: (id: string) =>
    fetcher(`/api/media/${id}/share`, { method: 'DELETE' }),

  list: (workspaceId: string, params?: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
  }) => {
    const query = new URLSearchParams();
    query.append('workspaceId', workspaceId);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());

    return fetcher(`/api/media?${query.toString()}`);
  }
};
