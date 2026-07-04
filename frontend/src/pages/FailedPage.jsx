import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function FailedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error") || "declined";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      
      {/* Background gradients */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-red-500/10 dark:bg-red-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-850 rounded-[40px] shadow-2xl p-8 md:p-10 relative z-10 text-center space-y-6">
        
        {/* Error icon */}
        <div className="h-20 w-20 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-red-100 dark:border-red-900/30">
          <AlertCircle size={40} className="animate-pulse" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
          <span>Transaction Failed</span>
        </span>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Demo UPI Payment Failed
          </h1>
          <p className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
            {error === "simulated_decline" ? "Declined by Simulated UPI Network" : "Checkout server error"}
          </p>
        </div>

        <p className="text-slate-550 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
          Your payment could not be processed. No funds were debited, and your TeamPulse subscription remains unchanged.
        </p>

        {/* Buttons list */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-650 to-red-600 hover:from-red-700 hover:to-red-650 text-white rounded-3xl font-black text-sm transition shadow-lg shadow-red-500/10 flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <RefreshCw size={16} />
            Try Payment Again
          </button>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3.5 px-6 border dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-3xl font-bold text-xs text-slate-450 dark:text-slate-400 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
