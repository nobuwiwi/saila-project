import { apiClient } from './client';
import { useAuthStore } from '../store/authStore';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/accounts/login/', { email, password });
    return response.data;
  },
  
  register: async (email: string, password: string, display_name: string) => {
    const response = await apiClient.post('/accounts/register/', { email, password, display_name });
    return response.data;
  },
  
  getMe: async () => {
    const response = await apiClient.get('/accounts/me/');
    return response.data;
  },
  
  logout: () => {
    useAuthStore.getState().logout();
  }
};
