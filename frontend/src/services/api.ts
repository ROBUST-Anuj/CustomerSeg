import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerseg_token') || sessionStorage.getItem('customerseg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      localStorage.removeItem('customerseg_token');
      sessionStorage.removeItem('customerseg_token');
      localStorage.removeItem('customerseg_user');
      sessionStorage.removeItem('customerseg_user');
    }
    return Promise.reject(error);
  }
);

export default api;
