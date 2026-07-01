import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.instance.interceptors.request.use((config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle errors
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // If the request set skipAuthRedirect, do not perform the global redirect on 401
        const skip = error.config && error.config.skipAuthRedirect;
        if (error.response?.status === 401 && !skip) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public get<T = any>(url: string, config?: any) {
    return this.instance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: any) {
    return this.instance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: any) {
    return this.instance.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: any) {
    return this.instance.delete<T>(url, config);
  }

  public patch<T = any>(url: string, data?: any, config?: any) {
    return this.instance.patch<T>(url, data, config);
  }
}

export const apiClient = new ApiClient();
