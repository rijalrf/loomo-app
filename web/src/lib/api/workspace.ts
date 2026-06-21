import { fetcher } from './fetcher';

export const workspaceApi = {
  invite: (workspaceId: string, email: string, role: 'MEMBER' | 'OWNER') =>
    fetcher('/api/workspace/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, email, role })
    }),

  getMembers: (workspaceId: string) =>
    fetcher(`/api/workspace/members?workspaceId=${workspaceId}`),

  removeMember: (membershipId: string) =>
    fetcher(`/api/workspace/members/${membershipId}`, {
      method: 'DELETE'
    }),

  updateStorageSetting: (id: string, saveToOwnerDrive: boolean) =>
    fetcher('/api/workspace', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, saveToOwnerDrive })
    }),

  create: (name: string, saveToOwnerDrive: boolean) =>
    fetcher('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, saveToOwnerDrive })
    })
};
