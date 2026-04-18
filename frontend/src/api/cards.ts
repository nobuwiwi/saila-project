import { apiClient } from './client';
import type { BusinessCard } from '../types';

export const cardsApi = {
  // getCards: Optional workspaceId filter. If pass "trash", maybe it's not a workspaceId.
  // Actually, there's a specific endpoint for trash `/api/cards/trash/`.
  // `/api/cards/?workspace={id}`
  getCards: async (workspaceId?: string): Promise<BusinessCard[]> => {
    const url = workspaceId ? `/cards/?workspace=${workspaceId}` : '/cards/';
    const response = await apiClient.get<BusinessCard[]>(url);
    return response.data;
  },

  // createCard: upload form data
  createCard: async (data: FormData): Promise<BusinessCard> => {
    const response = await apiClient.post<BusinessCard>('/cards/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // updateCard: patch partial data
  updateCard: async (id: string, data: Partial<BusinessCard>): Promise<BusinessCard> => {
    const response = await apiClient.patch<BusinessCard>(`/cards/${id}/`, data);
    return response.data;
  },

  // deleteCard: logical delete
  deleteCard: async (id: string): Promise<void> => {
    await apiClient.delete(`/cards/${id}/`);
  },

  // analyze: trigger AI analysis
  triggerAnalyze: async (id: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(`/cards/${id}/analyze/`);
    return response.data;
  },

  // getTrash: explicitly fetch trashed cards
  getTrash: async (): Promise<BusinessCard[]> => {
    const response = await apiClient.get<BusinessCard[]>('/cards/trash/');
    return response.data;
  },

  // restoreCard: restore from trash
  restoreCard: async (id: string): Promise<void> => {
    await apiClient.post(`/cards/${id}/restore/`);
  },

  // hardDeleteCard: permanently delete
  hardDeleteCard: async (id: string): Promise<void> => {
    await apiClient.delete(`/cards/${id}/hard_delete/`);
  },
};
