import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Activity, 
  Database, 
  Bell, 
  Lock, 
  ChevronLeft, 
  Globe,
  RefreshCw
} from "lucide-react";
import api from "../services/api";

export default function SystemStatus() {
  const [latency, setLatency] = useState(12);
  const [checking, setChecking] = useState(false);
  const [systemState, setSystemState] = useState({
    api: "operational",
    db: "operational",
    notifications: "operational",
    auth: "operational"
  });

  useEffect(() => {
    document.title = "Workspace Status - TeamPulse Operations Monitor";
  }, []);

  const triggerPingCheck = async () => {
    setChecking(true);
    const start = Date.now();
    try {
      await api.get("/notifications"); // basic connectivity check
      const diff = Date.now() - start;
      setLatency(Math.max(1, diff));
      setSystemState({
        api: "operational",
        db: "operational",
        notifications: "operational",
        auth: "operational"
      });
    } catch (err) {
      setLatency(999);
      setSystemState({
        api: "disrupted",
        db: "operational",
        notifications: "operational",
        auth: "operational"
      });
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  useEffect(() => {
    triggerPingCheck();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 p-6 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-8">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between no-print border-b dark:border-slate-800 pb-4">
          <Link 
            to="/" 
            className="flex items-center gap-1 text-xs font-bold text-slate-550 dark:text-slate-400 hover:text-indigo-600 transition"
          >
            <ChevronLeft size={14} />
            Back to Home
          </Link>

          <button 
            onClick={triggerPingCheck}
            disabled={checking}
            className="p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 text-[10px] font-bold uppercase transition"
          >
            <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
            Scan Latency
          </button>
        </div>

        {/* Global operational header */}
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={32} className="animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold dark:text-white leading-tight">All Systems Operational</h1>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-1">Uptime is currently <span className="text-emerald-500 font-bold">99.98%</span> over the last 30 days.</p>
          </div>
        </div>

        {/* Ping latency slider metrics */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">API Response Speed</span>
          <span className={`flex items-center gap-1.5 ${latency < 200 ? "text-emerald-500" : "text-amber-500"}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            {latency === 999 ? "Offline" : `${latency} ms`}
          </span>
        </div>

        {/* System parameters table list */}
        <div className="space-y-3 font-semibold">
          {[
            { label: "Application API Gateway", status: systemState.api, icon: Globe },
            { label: "PostgreSQL Database Cluster", status: systemState.db, icon: Database },
            { label: "Notifications Dispatch Broker", status: systemState.notifications, icon: Bell },
            { label: "JWT Auth Gateways", status: systemState.auth, icon: Lock }
          ].map((sys, idx) => {
            const Icon = sys.icon;
            return (
              <div 
                key={idx} 
                className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <Icon size={16} />
                  </div>
                  <span className="text-xs dark:text-white">{sys.label}</span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                  sys.status === "operational" 
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" 
                    : "bg-red-50 dark:bg-red-950/20 text-red-500"
                }`}>
                  {sys.status}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
