import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/utils/storage';

import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:5000/api/v1`;
    }
    if (hostname) {
      return `http://${hostname}:5000/api/v1`;
    }
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
};

const API_URL = getBaseUrl();

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

let onLogout: (() => void) | null = null;

export function setLogoutHandler(handler: () => void) {
  onLogout = handler;
}

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

async function handleLogout() {
  await clearTokens();
  onLogout?.();
  router.navigate('/login');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    console.log('❌ API ERROR:', error);
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Response:', error.response?.data);
    console.log('❌ Message:', error.message);
    console.log('❌ URL:', error.config?.url);

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh-token')) {
      await handleLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await handleLogout();
        return Promise.reject(error);
      }

      const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken,
      });
      const payload = data.data;
      const newAccessToken = payload.accessToken as string;
      const newRefreshToken = payload.refreshToken as string;

      await saveTokens(newAccessToken, newRefreshToken);
      processQueue(newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(null);
      await handleLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong',
): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default api;
