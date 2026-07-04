import { useState, useEffect } from "react";
import { aiService } from "../services/aiService";
import api from "../services/api";
import { Sparkles, Activity, AlertTriangle, ShieldCheck, ArrowRight, Lightbulb } from "lucide-react";

export default function AIInsights({ tasks: propTasks, members: propMembers }) {
  const [tasks, setTasks] = useState(propTasks || []);
  const [members, setMembers] = useState(propMembers || []);

  useEffect(() => {
    if (propTasks) setTasks(propTasks);
  }, [propTasks]);

  useEffect(() => {
    if (propMembers) setMembers(propMembers);
  }, [propMembers]);

  // If not passed in props, load dynamically as fallback
  useEffect(() => {
    if (!propTasks || !propMembers) {
      const load = async () => {
        try {
          const [tRes, mRes] = await Promise.all([
            api.get("/tasks"),
            api.get("/users")
          ]);
          setTasks(tRes.data);
          setMembers(mRes.data);
        } catch (err) {
          console.error("AI Insights loader error", err);
        }
      };
      load();
    }
  }, []);

  const metrics = aiService.calculateWorkspaceMetrics(tasks, members);

  return (
    <div className="bg-gradient-to-br from-[#111827] via-[#1e293b] to-[#1e1b4b] dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 text-white rounded-[32px] shadow-xl p-8 border border-slate-800">
      
      {/* Title block */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="text-indigo-400" size={22} />
          <div>
            <h3 className="text-xl font-bold">AI Workspace Summary</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Automated workload scans and threat index calculations</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-[10px] uppercase font-bold tracking-wider rounded-full border border-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Diagnostics
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Metric Gauges panel */}
        <div className="space-y-4 lg:border-r border-slate-800 lg:pr-8">
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Activity size={14} className="text-indigo-400" />
                Overall Productivity
              </span>
              <span className="font-bold text-indigo-400">{metrics.productivityScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${metrics.productivityScore}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Workspace Health
              </span>
              <span className="font-bold text-emerald-400">{metrics.healthScore}/100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${metrics.healthScore}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-400" />
                Risk Index
              </span>
              <span className="font-bold text-red-450">{metrics.riskScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${metrics.riskScore}%` }} />
            </div>
          </div>

          <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl text-xs font-bold border border-white/5">
            <span className="text-slate-400">Overdue Task Alerts</span>
            <span className={metrics.overdue > 0 ? "text-red-400" : "text-emerald-400"}>
              {metrics.overdue} tasks
            </span>
          </div>
        </div>

        {/* Suggested Next Actions */}
        <div className="space-y-3.5 lg:border-r border-slate-800 lg:pr-8">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <ArrowRight size={13} />
            Next Action Heuristics
          </h4>
          <div className="space-y-2 text-xs">
            {metrics.nextActions.map((action, idx) => (
              <div key={idx} className="p-3 bg-white/5 rounded-2xl border border-white/5 font-semibold text-slate-200">
                {action}
              </div>
            ))}
          </div>
        </div>

        {/* Daily Recommendations */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
            <Lightbulb size={13} className="text-amber-400" />
            Daily AI Recommendations
          </h4>
          <div className="space-y-3">
            {metrics.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-indigo-950/40 border border-indigo-900/40 rounded-2xl text-xs font-medium leading-relaxed text-indigo-200">
                {rec}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}