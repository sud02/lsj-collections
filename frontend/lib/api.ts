import axios, { AxiosError, AxiosInstance } from "axios";

export const TOKEN_KEY = "lsj_token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.lsjcollections.com/api",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      response.data = (body as { data: unknown }).data;
    }
    return response;
  },
  (error: AxiosError<{ success?: boolean; error?: string; code?: string }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearToken();
      window.dispatchEvent(new CustomEvent("lsj:auth-expired"));
    }
    const apiError = error.response?.data?.error;
    if (apiError) {
      error.message = apiError;
    }
    return Promise.reject(error);
  }
);

export const cdnUrl = (path?: string): string => {
  const base = process.env.NEXT_PUBLIC_CDN_URL || "https://lsjcollections.com/panels/admin";
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${base}/${path.replace(/^\/+/, "")}`;
};

export const productImage = (filename?: string): string =>
  filename ? cdnUrl(`product/${filename}`) : "";

export const categoryImage = (filename?: string): string =>
  filename ? cdnUrl(`category/${filename}`) : "";

export const subcategoryImage = (filename?: string): string =>
  filename ? cdnUrl(`subcategory/${filename}`) : "";

export const advertisementImage = (filename?: string): string =>
  filename ? cdnUrl(`advertisements/${filename}`) : "";

export default api;
