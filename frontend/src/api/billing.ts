import { apiClient } from './client';

export const billingApi = {
  createCheckoutSession: async () => {
    const response = await apiClient.post<{ url: string }>('/billing/checkout/');
    return response.data;
  },
  createPortalSession: async () => {
    const response = await apiClient.post<{ url: string }>('/billing/portal/');
    return response.data;
  },
};
