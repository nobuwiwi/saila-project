import { apiClient } from './client';
import type { Workspace, WorkspaceCreateInput, WorkspaceUpdateInput } from '../types';

export const workspacesApi = {
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await apiClient.get('/workspaces/');
    return response.data;
  },

  createWorkspace: async (data: WorkspaceCreateInput): Promise<Workspace> => {
    const response = await apiClient.post('/workspaces/', data);
    return response.data;
  },

  updateWorkspace: async (id: string, data: WorkspaceUpdateInput): Promise<Workspace> => {
    const response = await apiClient.patch(`/workspaces/${id}/`, data);
    return response.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}/`);
  },

  setDefaultWorkspace: async (id: string): Promise<Workspace> => {
    const response = await apiClient.post(`/workspaces/${id}/set_default/`);
    return response.data;
  },
};
