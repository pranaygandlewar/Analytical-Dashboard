import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Chrome, ChevronRight, Eye, EyeOff, Plus, ShieldCheck, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import Avatar from "../components/Avatar";
import AuthShell from "../components/AuthShell";

const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getSavedSessions = () => {
  try {
    const data = localStorage.getItem("teampulse_sessions");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showChooser, setShowChooser] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const list = getSavedSessions();
    setSavedAccounts(list);
    setShowChooser(list.length > 0);
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      navigate("/login", { replace: true });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      const message = "Google login could not be completed.";
      setError(message);
      toast.error(message);
    }
  }, [searchParams]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      toast.error(result.message);
      setLoading(false);
      return;
    }

    toast.success(`Welcome back, ${result.user.name}`);
    navigate("/dashboard");
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const redirectTo = `${window.location.origin}/auth/google/callback`;
    window.location.href = `${apiBase}/auth/google?redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  const handleSelectAccount = async (session) => {
    setLoading(true);
    try {
      sessionStorage.setItem("token", session.token);
      localStorage.setItem("teampulse_active_token", session.token);

      useAuthStore.setState({
        user: session.user,
        isAuthenticated: true,
        authLoading: false,
      });

      await checkAuth();

      if (!useAuthStore.getState().isAuthenticated) {
        toast.error("Session has expired. Please sign in again.");
        return;
      }

      toast.success(`Logged in as ${session.user.name}`);
      navigate("/dashboard");
    } catch {
      toast.error("Failed to restore session context");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = (event, accountEmail) => {
    event.stopPropagation();
    const updated = savedAccounts.filter((session) => session.user.email !== accountEmail);
    setSavedAccounts(updated);
    localStorage.setItem("teampulse_sessions", JSON.stringify(updated));
    toast.success("Session removed from saved list");
    if (updated.length === 0) {
      setShowChooser(false);
    }
  };

  return (
    <AuthShell
      title="TeamPulse"
      subtitle="Enterprise productivity workspace for modern teams. Manage projects, workflows, analytics, and collaboration securely."
      highlights={[
        "Real-time team analytics",
        "Secure role-based access",
        "Intelligent workflow automation",
      ]}
    >
      {showChooser ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-slate-900">Choose account</h2>
            <p className="text-slate-500 mt-3 text-sm font-semibold">Select an account to resume TeamPulse</p>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {savedAccounts.map((session) => (
              <button
                key={session.user.email}
                onClick={() => handleSelectAccount(session)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 hover:border-indigo-100 rounded-2xl cursor-pointer group transition duration-300 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 overflow-hidden text-left">
                  <Avatar user={session.user} size="sm" />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-slate-800 leading-snug group-hover:text-indigo-650 transition">{session.user.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">{session.user.email}</p>
                    <span className="inline-block text-[8px] font-black uppercase text-indigo-650 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 mt-1">
                      {session.user.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    onClick={(event) => handleRemoveAccount(event, session.user.email)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition duration-200"
                    title="Remove session details"
                    role="button"
                    tabIndex={0}
                  >
                    <Trash2 size={13} />
                  </span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowChooser(false)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold transition active:scale-[0.99]"
          >
            <Plus size={16} />
            <span>Use Another Account</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
          <h2 className="text-4xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-3">Access your workspace securely</p>

          <div className="relative mt-10 bg-slate-100 rounded-2xl p-1 flex">
            <div
              className={`absolute top-1 bottom-1 w-1/2 rounded-xl bg-slate-900 shadow-md transition-all duration-500 ${
                selectedRole === "admin" ? "left-1" : "left-[50%]"
              }`}
            />

            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              className={`relative z-10 flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition duration-300 ${
                selectedRole === "admin" ? "text-white" : "text-slate-600"
              }`}
            >
              <ShieldCheck size={18} />
              Admin
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("member")}
              className={`relative z-10 flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition duration-300 ${
                selectedRole === "member" ? "text-white" : "text-slate-600"
              }`}
            >
              <User size={18} />
              Member
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-600 p-4 font-semibold text-xs">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-5">
            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-200 font-medium text-sm transition"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-12 outline-none focus:ring-2 focus:ring-indigo-200 font-medium text-sm transition"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white py-4 font-semibold transition active:scale-[0.99] shadow-md shadow-slate-950/10"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="flex items-center gap-4 text-xs font-bold uppercase text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              OR
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-4 font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Chrome size={18} />
              Continue with Google
            </button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-sm font-semibold">
            {savedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowChooser(true)}
                className="text-indigo-600 hover:underline text-left"
              >
                Back to Account Chooser
              </button>
            )}
            <p className="text-slate-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-indigo-600 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
