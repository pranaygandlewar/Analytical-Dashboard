import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.error("VITE_API_URL environment variable is missing. Please configure it in your .env file.");
}

const api = axios.create({
  baseURL: apiUrl || "http://127.0.0.1:8000",
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;