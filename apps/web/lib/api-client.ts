import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const { token } = JSON.parse(stored) as { token?: string };
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        /* ignore */
      }
    }
  }
  return config;
});
