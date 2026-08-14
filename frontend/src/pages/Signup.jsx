import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";
import useAuthStore from "../store/authStore";

export default function Signup() {
  const navigate = useNavigate();

  const signup = useAuthStore((state) => state.signup);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (cleanName.length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one digit.");
      return;
    }

    setLoading(true);

    const result = await signup(
      cleanName,
      cleanEmail,
      password,
      confirmPassword
    );

    if (!result.success) {
      setError(result.message);
      toast.error(result.message);
      setLoading(false);
      return;
    }

    sessionStorage.setItem(
      "pending_verification_email",
      cleanEmail
    );

    toast.success("Verification code sent to your email.");

    navigate(
      `/verify-email?email=${encodeURIComponent(cleanEmail)}`
    );

    setLoading(false);
  };

  return (
    <AuthShell
      title="Join TeamPulse"
      subtitle="Create your secure TeamPulse account and start managing your team's productivity, projects, and analytics."
      highlights={[
        "Secure email verification",
        "Role-based team workspace",
        "Real-time productivity insights",
      ]}
    >
      <div className="w-full max-w-xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <UserPlus size={20} />
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Create Account
              </h2>

              <p className="text-slate-500 mt-1">
                Create your TeamPulse member account
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Full Name
            </label>

            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Email Address
            </label>

            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-14 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                disabled={loading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              At least 8 characters, including uppercase, lowercase,
              and a number.
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                disabled={loading}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-14 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                disabled={loading}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Account type information */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-indigo-600">
                <ShieldCheck size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Team Member Account
                </p>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  New public accounts are created as team members.
                  Administrator accounts are managed separately for
                  security.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 py-4 font-semibold text-white transition hover:bg-slate-800 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}