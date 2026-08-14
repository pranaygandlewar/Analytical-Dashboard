import { create } from "zustand";
import api from "../services/api";

const SESSIONS_KEY = "teampulse_sessions";
const ACTIVE_TOKEN_KEY = "teampulse_active_token";

const getSavedSessions = () => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions) => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

const getActiveToken = () => (
  sessionStorage.getItem("token") || localStorage.getItem(ACTIVE_TOKEN_KEY)
);

const setActiveToken = (token) => {
  sessionStorage.setItem("token", token);
  localStorage.setItem(ACTIVE_TOKEN_KEY, token);
};

const clearActiveToken = () => {
  sessionStorage.removeItem("token");
  localStorage.removeItem(ACTIVE_TOKEN_KEY);
};

const getErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(". ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return fallback;
};

const persistSession = (token, user) => {
  setActiveToken(token);
  const sessions = getSavedSessions();
  const existingIdx = sessions.findIndex((session) => session.user.email === user.email);
  const nextSession = { token, user };

  if (existingIdx !== -1) {
    sessions[existingIdx] = nextSession;
  } else {
    sessions.unshift(nextSession);
  }

  saveSessions(sessions);
};

const removeSavedSession = (email) => {
  const sessions = getSavedSessions();
  const updated = sessions.filter((session) => session.user.email !== email);
  saveSessions(updated);
  return updated;
};

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,
  authError: "",

  login: async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      persistSession(res.data.access_token, res.data.user);

      set({
        user: res.data.user,
        isAuthenticated: true,
        authLoading: false,
        authError: "",
      });

      return { success: true, user: res.data.user };
    } catch (error) {
      const message = getErrorMessage(error, "Invalid email or password.");
      set({ authLoading: false, authError: message });
      return { success: false, message };
    }
  },

  signup: async (name, email, password, confirmPassword, role) => {
    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
        confirm_password: confirmPassword,
        role,
      });

      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Signup failed"),
      };
    }
  },

  verifyEmail: async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-email", { email, otp });
      persistSession(res.data.access_token, res.data.user);
      sessionStorage.removeItem("pending_verification_email");

      set({
        user: res.data.user,
        isAuthenticated: true,
        authLoading: false,
        authError: "",
      });

      return { success: true, user: res.data.user };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Verification failed"),
      };
    }
  },

  resendVerificationOtp: async (email) => {
    try {
      const res = await api.post("/auth/resend-verification-otp", { email });
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Could not resend verification code"),
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await api.post("/auth/forgot-password", { email });
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Could not start password reset"),
      };
    }
  },

  verifyResetOtp: async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-reset-otp", { email, otp });
      sessionStorage.setItem("reset_password_email", res.data.email);
      sessionStorage.setItem("reset_password_token", res.data.reset_token);
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Verification failed"),
      };
    }
  },

  resendResetOtp: async (email) => {
    try {
      const res = await api.post("/auth/resend-reset-otp", { email });
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Could not resend reset code"),
      };
    }
  },

  resetPassword: async (email, resetToken, newPassword, confirmPassword) => {
    try {
      const res = await api.post("/auth/reset-password", {
        email,
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      sessionStorage.removeItem("reset_password_email");
      sessionStorage.removeItem("reset_password_token");
      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Password reset failed"),
      };
    }
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    try {
      const res = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      return { success: true, data: res.data };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, "Failed to change password"),
      };
    }
  },

  completeOAuthLogin: async (token) => {
    setActiveToken(token);

    try {
      const res = await api.get("/auth/me");
      persistSession(token, res.data);

      set({
        user: res.data,
        isAuthenticated: true,
        authLoading: false,
        authError: "",
      });

      return { success: true, user: res.data };
    } catch (error) {
      clearActiveToken();
      set({ user: null, isAuthenticated: false, authLoading: false });
      return {
        success: false,
        message: getErrorMessage(error, "Google login failed"),
      };
    }
  },

  checkAuth: async () => {
    const token = getActiveToken();

    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
      });
      return;
    }

    setActiveToken(token);

    try {
      const res = await api.get("/auth/me");
      persistSession(token, res.data);

      set({
        user: res.data,
        isAuthenticated: true,
        authLoading: false,
        authError: "",
      });
    } catch {
      clearActiveToken();
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
      });
    }
  },

  switchAccount: (email) => {
    const sessions = getSavedSessions();
    const target = sessions.find((session) => session.user.email === email);
    if (target) {
      persistSession(target.token, target.user);
      set({
        user: target.user,
        isAuthenticated: true,
        authLoading: false,
      });
      window.location.reload();
    }
  },

  removeAccount: (email) => {
    const updated = removeSavedSession(email);
    const activeUser = useAuthStore.getState().user;

    if (activeUser && activeUser.email === email) {
      if (updated.length > 0) {
        const next = updated[0];
        persistSession(next.token, next.user);
        set({ user: next.user, isAuthenticated: true });
        window.location.reload();
      } else {
        clearActiveToken();
        set({ user: null, isAuthenticated: false });
        window.location.href = "/login";
      }
    }
  },

  logout: () => {
    const activeUser = useAuthStore.getState().user;
    if (activeUser) {
      removeSavedSession(activeUser.email);
    }

    api.post("/auth/logout").catch(() => {});
    clearActiveToken();
    set({
      user: null,
      isAuthenticated: false,
      authLoading: false,
      authError: "",
    });
  },

  logoutCurrent: () => {
    const activeUser = useAuthStore.getState().user;
    const updated = activeUser ? removeSavedSession(activeUser.email) : getSavedSessions();

    if (updated.length > 0) {
      const next = updated[0];
      persistSession(next.token, next.user);
      set({ user: next.user, isAuthenticated: true, authLoading: false });
      window.location.reload();
      return;
    }

    api.post("/auth/logout").catch(() => {});
    clearActiveToken();
    set({ user: null, isAuthenticated: false, authLoading: false });
    window.location.href = "/login";
  },

  logoutAll: () => {
    localStorage.removeItem(SESSIONS_KEY);
    api.post("/auth/logout").catch(() => {});
    clearActiveToken();
    set({ user: null, isAuthenticated: false, authLoading: false });
    window.location.href = "/login";
  },
}));

export default useAuthStore;
