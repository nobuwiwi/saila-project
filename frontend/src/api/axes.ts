import { apiClient } from './client';
import type { UserBusinessAxis } from '../types';

interface Choice {
  value: string;
  label: string;
}

export const axesApi = {
  getAxisChoices: async (): Promise<Choice[]> => {
    const res = await apiClient.get('/axes/choices/');
    return res.data;
  },

  getUserAxes: async (): Promise<UserBusinessAxis[]> => {
    const res = await apiClient.get('/axes/');
    return res.data;
  },

  addAxis: async (axis: string): Promise<UserBusinessAxis> => {
    const res = await apiClient.post('/axes/', { axis });
    return res.data;
  },

  removeAxis: async (id: string): Promise<void> => {
    await apiClient.delete(`/axes/${id}/`);
  },
};
