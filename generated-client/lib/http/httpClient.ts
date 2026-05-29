import Axios, { AxiosRequestConfig, AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: `${BASE_URL}/api/v1/wms`,
  headers: { 'Content-Type': 'application/json' },
});

AXIOS_INSTANCE.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantCode = localStorage.getItem('tenant_code');
    if (tenantCode) {
      config.headers['X-Tenant-Code'] = tenantCode;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
  }).then(({ data }) => data);

  return promise;
};

export default customInstance;
