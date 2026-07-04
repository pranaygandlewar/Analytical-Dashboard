import { create } from "zustand";
import api from "../services/api";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,

  login: async (email, password) => {
    try {
      const res = await api.post("/login", {
        email,
        password,
      });

      sessionStorage.setItem(
        "token",
        res.data.access_token
      );

      set({
        user: res.data.user,
        isAuthenticated: true,
        authLoading: false,
      });

      return {
        success: true,
        user: res.data.user,
      };
    } catch (error) {
      let message = "Login failed";

      if (Array.isArray(error.response?.data?.detail)) {
        message = error.response.data.detail[0].msg;
      } else if (
        typeof error.response?.data?.detail === "string"
      ) {
        message = error.response.data.detail;
      }

      set({
        authLoading: false,
      });

      return {
        success: false,
        message,
      };
    }
  },

  signup: async (name, email, password, role) => {
    try {
      await api.post("/signup", {
        name,
        email,
        password,
        role,
      });

      return { success: true };
    } catch (error) {
      let message = "Signup failed";

      if (
        typeof error.response?.data?.detail === "string"
      ) {
        message = error.response.data.detail;
      }

      return {
        success: false,
        message,
      };
    }
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
      });
      return;
    }

    try {
      const res = await api.get("/me");

      set({
        user: res.data,
        isAuthenticated: true,
        authLoading: false,
      });
    } catch {
      sessionStorage.removeItem("token");

      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
      });
    }
  },

  logout: () => {
    sessionStorage.removeItem("token");

    set({
      user: null,
      isAuthenticated: false,
      authLoading: false,
    });
  },
}));

export default useAuthStore;