import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, User, Plus, Trash2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { motion } from "framer-motion";
import Avatar from "../components/Avatar";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const [selectedRole, setSelectedRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Account Chooser States
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showChooser, setShowChooser] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem("teampulse_sessions");
      const list = data ? JSON.parse(data) : [];
      setSavedAccounts(list);
      if (list.length > 0) {
        setShowChooser(true);
      }
    } catch {
      setSavedAccounts([]);
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.message);
      toast.error(result.message);
      setLoading(false);
      return;
    }

    if (result.user.role !== selectedRole) {
      const roleError = `This account is not a ${selectedRole} account`;
      setError(roleError);
      toast.error(roleError);
      setLoading(false);
      return;
    }

    toast.success("Welcome back");
    navigate("/dashboard");
    setLoading(false);
  };

  const handleSelectAccount = async (session) => {
    setLoading(true);
    try {
      sessionStorage.setItem("token", session.token);
      
      // Update auth store state instantly to satisfy ProtectedRoute guard immediately
      useAuthStore.setState({
        user: session.user,
        isAuthenticated: true,
        authLoading: false
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

  const handleRemoveAccount = (e, email) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(s => s.user.email !== email);
    setSavedAccounts(updated);
    localStorage.setItem("teampulse_sessions", JSON.stringify(updated));
    toast.success("Session removed from saved list");
    if (updated.length === 0) {
      setShowChooser(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-8"
    >
      
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-150px] left-[-100px] w-[600px] h-[600px] bg-indigo-600/15 blur-3xl rounded-full animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] bg-cyan-500/10 blur-3xl rounded-full animate-[pulse_12s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_35%)]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-6xl rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left */}
        <div className="p-16 flex flex-col justify-center text-white border-r border-white/10">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 rounded-2xl object-cover shadow-lg mb-10" />
          <h1 className="text-5xl font-bold tracking-tight">TeamPulse</h1>
          <p className="mt-6 text-slate-300 text-lg leading-relaxed max-w-lg">
            Enterprise productivity workspace for modern teams.
            Manage projects, workflows, analytics, and collaboration seamlessly.
          </p>

          <div className="mt-12 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">Real-time team analytics</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">Secure role-based access</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">Intelligent workflow automation</div>
          </div>
        </div>

        {/* Right */}
        <div className="bg-white p-16 flex flex-col justify-center min-h-[580px]">
          {showChooser ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-slate-900">Choose account</h2>
                <p className="text-slate-550 mt-3 text-sm font-semibold">Select an account to resume to TeamPulse</p>
              </div>

              {/* Account Chooser List */}
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {savedAccounts.map((session) => (
                  <div
                    key={session.user.email}
                    onClick={() => handleSelectAccount(session)}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 hover:border-indigo-100 rounded-2xl cursor-pointer group transition duration-300 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
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
                      <button
                        onClick={(e) => handleRemoveAccount(e, session.user.email)}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition duration-200"
                        title="Remove session details"
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowChooser(false)}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold transition active:scale-[0.99]"
                >
                  <Plus size={16} />
                  <span>Use Another Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-4xl font-bold text-slate-900">Sign In</h2>
              <p className="text-slate-500 mt-3">Access your workspace securely</p>

              {/* Smooth Role Switch */}
              <div className="relative mt-10 bg-slate-100 rounded-2xl p-1 flex">
                <div
                  className={`absolute top-1 bottom-1 w-1/2 rounded-xl bg-slate-900 shadow-md transition-all duration-500 ${
                    selectedRole === "admin"
                      ? "left-1"
                      : "left-[50%]"
                  }`}
                />

                <button
                  onClick={() => setSelectedRole("admin")}
                  className={`relative z-10 flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition duration-300 ${
                    selectedRole === "admin"
                      ? "text-white"
                      : "text-slate-600"
                  }`}
                >
                  <ShieldCheck size={18} />
                  Admin
                </button>

                <button
                  onClick={() => setSelectedRole("member")}
                  className={`relative z-10 flex-1 py-4 flex items-center justify-center gap-2 font-semibold transition duration-300 ${
                    selectedRole === "member"
                      ? "text-white"
                      : "text-slate-600"
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
                  onChange={(e) => setEmail(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-200 font-medium text-sm transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-4 font-semibold transition active:scale-[0.99] shadow-md shadow-slate-950/10"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>

              <div className="mt-8 flex justify-between items-center text-sm font-semibold">
                {savedAccounts.length > 0 && (
                  <button
                    onClick={() => setShowChooser(true)}
                    className="text-indigo-600 hover:underline"
                  >
                    Back to Account Chooser
                  </button>
                )}
                <p className="text-slate-500">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-indigo-600 hover:underline">
                    Create account
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}