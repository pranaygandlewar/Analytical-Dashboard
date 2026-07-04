import { Link } from "react-router-dom";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

export default function PremiumLockOverlay({ requiredPlan = "Pro" }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md rounded-3xl transition-all duration-300">
      <div className="max-w-md w-full text-center bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/80 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative dynamic circles */}
        <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-2xl rounded-full" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[150px] h-[150px] bg-purple-500/10 dark:bg-purple-500/20 blur-2xl rounded-full" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Lock Icon */}
          <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-6 relative">
            <Lock size={28} />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500"></span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4">
            <Sparkles size={10} />
            <span>Premium Feature</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            Upgrade to {requiredPlan}
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            Unlock advanced dashboard views, real-time analytics reports, custom workspace options, and unrestricted AI assistant usage metrics.
          </p>

          <Link
            to="/settings?tab=billing"
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold transition shadow-lg shadow-indigo-600/20 hover:scale-[1.02]"
          >
            <span>Upgrade to {requiredPlan}</span>
            <ArrowRight size={16} />
          </Link>
          
          <Link
            to="/dashboard"
            className="mt-4 text-xs font-semibold text-slate-450 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition"
          >
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
