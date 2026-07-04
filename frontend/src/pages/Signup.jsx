import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, User } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((state) => state.signup);

  const [selectedRole, setSelectedRole] = useState("member");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setError("");

    const result = await signup(
      name,
      email,
      password,
      selectedRole
    );

    if (!result.success) {
      setError(result.message);
      toast.error(result.message);
      setLoading(false);
      return;
    }

    toast.success("Account created successfully");
    navigate("/login");
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-8">
      
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-150px] left-[-100px] w-[600px] h-[600px] bg-indigo-600/15 blur-3xl rounded-full animate-[pulse_10s_ease-in-out_infinite]" />

        <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] bg-cyan-500/10 blur-3xl rounded-full animate-[pulse_12s_ease-in-out_infinite]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_35%)]" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-6xl rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        
        {/* Left */}
        <div className="p-16 flex flex-col justify-center text-white border-r border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold shadow-lg mb-10">
            T
          </div>

          <h1 className="text-5xl font-bold tracking-tight">
            Join TeamPulse
          </h1>

          <p className="mt-6 text-slate-300 text-lg leading-relaxed max-w-lg">
            Create your workspace and streamline collaboration with secure team productivity tools.
          </p>

          <div className="mt-12 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              Team collaboration & management
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              Role-based secure workspace
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              Real-time productivity insights
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="bg-white p-16">
          <h2 className="text-4xl font-bold text-slate-900">
            Create Account
          </h2>

          <p className="text-slate-500 mt-3">
            Start your workspace journey
          </p>

          {/* Smooth Role Switch */}
          <div className="relative mt-10 bg-white-100 rounded-2xl p-1 flex">
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
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 text-red-600 p-4">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-5">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-200 transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email address"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-200 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-200 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white py-4 font-semibold transition-all duration-300 hover:scale-[1.01]"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>

          <p className="mt-8 text-center text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}