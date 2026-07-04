import { create } from "zustand";
import api from "../services/api";

const getSavedSessions = () => {
  try {
    const data = localStorage.getItem("teampulse_sessions");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions) => {
  localStorage.setItem("teampulse_sessions", JSON.stringify(sessions));
};

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

      // Save/update session in localStorage
      const sessions = getSavedSessions();
      const existingIdx = sessions.findIndex(s => s.user.email === res.data.user.email);
      const newSession = { token: res.data.access_token, user: res.data.user };
      if (existingIdx !== -1) {
        sessions[existingIdx] = newSession;
      } else {
        sessions.push(newSession);
      }
      saveSessions(sessions);

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
    let token = sessionStorage.getItem("token");

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

      // Update session user details
      const currentSessions = getSavedSessions();
      const idx = currentSessions.findIndex(s => s.user.email === res.data.email);
      if (idx !== -1) {
        currentSessions[idx].user = res.data;
        saveSessions(currentSessions);
      }

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

  switchAccount: (email) => {
    const sessions = getSavedSessions();
    const target = sessions.find(s => s.user.email === email);
    if (target) {
      sessionStorage.setItem("token", target.token);
      set({
        user: target.user,
        isAuthenticated: true,
      });
      const remaining = sessions.filter(s => s.user.email !== email);
      saveSessions([target, ...remaining]);
      window.location.reload();
    }
  },

  removeAccount: (email) => {
    const sessions = getSavedSessions();
    const updated = sessions.filter(s => s.user.email !== email);
    saveSessions(updated);

    const activeUser = useAuthStore.getState().user;
    if (activeUser && activeUser.email === email) {
      if (updated.length > 0) {
        const next = updated[0];
        sessionStorage.setItem("token", next.token);
        set({ user: next.user });
        window.location.reload();
      } else {
        sessionStorage.removeItem("token");
        set({ user: null, isAuthenticated: false });
        window.location.href = "/login";
      }
    }
  },

  logout: () => {
    const activeUser = useAuthStore.getState().user;
    if (activeUser) {
      const sessions = getSavedSessions();
      const updated = sessions.filter(s => s.user.email !== activeUser.email);
      saveSessions(updated);

      if (updated.length > 0) {
        const next = updated[0];
        sessionStorage.setItem("token", next.token);
        set({ user: next.user });
        window.location.reload();
      } else {
        sessionStorage.removeItem("token");
        set({
          user: null,
          isAuthenticated: false,
          authLoading: false,
        });
      }
    } else {
      sessionStorage.removeItem("token");
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
      });
    }
  },

  logoutCurrent: () => {
    const activeUser = useAuthStore.getState().user;
    if (activeUser) {
      const sessions = getSavedSessions();
      const updated = sessions.filter(s => s.user.email !== activeUser.email);
      saveSessions(updated);

      if (updated.length > 0) {
        const next = updated[0];
        sessionStorage.setItem("token", next.token);
        set({ user: next.user });
        window.location.reload();
      } else {
        sessionStorage.removeItem("token");
        set({ user: null, isAuthenticated: false });
        window.location.href = "/login";
      }
    }
  },

  logoutAll: () => {
    localStorage.removeItem("teampulse_sessions");
    sessionStorage.removeItem("token");
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  }
}));

export default useAuthStore;