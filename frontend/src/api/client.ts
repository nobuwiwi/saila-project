import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Prevent infinite loops on login/refresh endpoints
    if (originalRequest.url === '/token/refresh/' || originalRequest.url === '/accounts/login/') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const rfToken = useAuthStore.getState().refreshToken;

      if (rfToken) {
        try {
          const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/token/refresh/`, { refresh: rfToken });
          const newAccess = res.data.access;

          useAuthStore.getState().setTokens(newAccess, rfToken);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
