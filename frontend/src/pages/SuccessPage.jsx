import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, ShieldCheck, Printer, Calendar, FileText } from "lucide-react";

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const plan = searchParams.get("plan") || "Pro";
  const orderId = searchParams.get("order_id") || "TXN_MOCK_17830";
  const invoice = searchParams.get("invoice") || "INV-2026-98124";
  const paymentDate = searchParams.get("date") || new Date().toLocaleString();
  const amount = searchParams.get("amount") || "588";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
      
      {/* Background gradients */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-xl w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-850 rounded-[40px] shadow-2xl p-8 md:p-10 relative z-10 text-center">
        
        {/* Animated Checkmark Icon */}
        <div className="h-20 w-20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
          <CheckCircle size={40} className="animate-bounce" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4 shadow-sm">
          <ShieldCheck size={10} />
          <span>Payment Successful</span>
        </span>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Subscription Upgraded!
        </h1>
        <p className="text-slate-450 dark:text-slate-500 font-bold text-xs mt-1.5 uppercase tracking-wide">
          Your workspace premium features have been unlocked
        </p>

        {/* Invoice Summary Box */}
        <div className="mt-8 bg-slate-50 dark:bg-slate-950/50 border dark:border-slate-850 rounded-3xl p-6 text-left space-y-4">
          <div className="flex justify-between items-center border-b dark:border-slate-850 pb-3 text-xs text-slate-450 uppercase font-mono tracking-wide">
            <span>Invoice Details</span>
            <button onClick={handlePrint} className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition">
              <Printer size={12} />
              Print
            </button>
          </div>

          <div className="space-y-3.5 text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-slate-400">Plan Purchased</span>
              <span className="text-slate-800 dark:text-white font-bold">{plan} Plan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction ID</span>
              <span className="text-slate-800 dark:text-white font-bold">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Invoice Number</span>
              <span className="text-slate-800 dark:text-white font-bold">{invoice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Date</span>
              <span className="text-slate-800 dark:text-white font-bold">{paymentDate}</span>
            </div>
            <div className="flex justify-between border-t dark:border-slate-850 pt-3 text-sm font-extrabold">
              <span className="text-slate-800 dark:text-slate-200">Amount Paid</span>
              <span className="text-slate-900 dark:text-white">₹{amount}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-8 w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-3xl font-black text-sm transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span>Go to Workspace</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
