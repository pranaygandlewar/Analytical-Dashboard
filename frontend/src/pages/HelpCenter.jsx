import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { 
  Keyboard, 
  HelpCircle, 
  BookOpen, 
  Info, 
  Play, 
  ChevronRight, 
  Compass, 
  Zap, 
  X,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";

export default function HelpCenter() {
  const [activeSubTab, setActiveSubTab] = useState("docs"); // docs, shortcuts, tour, changelog
  
  // Interactive Onboarding tour states
  const [tourStep, setTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);

  useEffect(() => {
    document.title = "Workspace Help Center - TeamPulse Support";
  }, []);

  const tourSteps = [
    { title: "Welcome to TeamPulse!", text: "Let's explore key platform controls. Click Next to proceed." },
    { title: "Responsive Collapsible Sidebar", text: "Toggle width using the bottom-left arrow chevron to maximize task viewport space." },
    { title: "Floating AI Assistant", text: "Look in the bottom-right corner. It processes NLP commands like 'Scan overdue' and creates tomorrow's assignments." },
    { title: "Dynamic Workspace Command Palette", text: "Press Cmd/Ctrl + K from anywhere to open global quick-search palettes." },
    { title: "Control Admin Settings & Roles", text: "Admins can adjust permission matrices under the Workspace settings tabs immediately." }
  ];

  const handleNextTourStep = () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(prev => prev + 1);
    } else {
      setIsTourActive(false);
      setTourStep(0);
      toast.success("Workspace Onboarding Tour Complete!");
    }
  };

  const docs = [
    { title: "Platform Overview", desc: "Understand workspaces, projects structure, notifications lists, and dashboard stats." },
    { title: "Roles & Permission Matrix Configuration", desc: "Admins can configure permissions for managers, members, and viewers." },
    { title: "Leveraging the NLP AI Assistant", desc: "Learn NLP commands: create tasks, check leaderboards, generate productivity reports." },
    { title: "SaaS Analytics & Visual Charting Widgets", desc: "Inspect productivity scores, timeline velocities, status pings, and horizontal member tables." }
  ];

  const shortcuts = [
    { keys: ["Cmd", "K"], action: "Open Command Palette Global Search" },
    { keys: ["Opt", "T"], action: "Navigate straight to Tasks board" },
    { keys: ["Opt", "A"], action: "Open Analytics diagnostics" },
    { keys: ["Opt", "S"], action: "Go to Profile Settings tabs" },
    { keys: ["Esc"], action: "Close modals, drawers, and overlay popups" }
  ];

  const changelog = [
    { version: "v2.1.0", date: "July 2026", updates: ["Added dynamic Workspace Settings configurations", "Created role permissions matric controls", "Upgraded User profiles with avatar photo upload limits", "Fixed invalid slate color tags text bugs"] },
    { version: "v2.0.0", date: "June 2026", updates: ["Redesigned main dashboards using Recharts area charts", "Integrated floating AI Productivity Assistant chat drawers", "Implemented code-splitting suspense fallbacks"] }
  ];

  return (
    <AppLayout>
      <div className="mt-8 mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Help Center</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Find documentation, global keyboard shortcuts, onboarding guides, and changelogs.</p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap items-center gap-1.5 mb-8 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-2 rounded-2xl text-xs font-bold w-fit">
        {[
          { id: "docs", label: "Documentation", icon: BookOpen },
          { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
          { id: "tour", label: "Onboarding Tour", icon: Compass },
          { id: "changelog", label: "Release Logs", icon: Info }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                active 
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main tabs content panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-7 min-h-[400px]">
          
          {activeSubTab === "docs" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <BookOpen className="text-indigo-650" size={18} />
                Workspace Documentation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc, idx) => (
                  <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm dark:text-white">{doc.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "shortcuts" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <Keyboard className="text-indigo-650" size={18} />
                Keyboard Shortcut Guides
              </h3>
              <div className="space-y-3 font-semibold text-xs text-slate-800 dark:text-slate-200">
                {shortcuts.map((sc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <span className="text-slate-500">{sc.action}</span>
                    <div className="flex items-center gap-1 font-mono">
                      {sc.keys.map((k, i) => (
                        <kbd key={i} className="px-2 py-1 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded shadow text-[10px] font-bold">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === "tour" && (
            <div className="space-y-6 flex flex-col items-center justify-center py-10 text-center">
              <Compass className="text-indigo-650 animate-spin duration-3000" size={48} />
              <div className="space-y-2">
                <h3 className="font-bold text-lg dark:text-white">Workspace Onboarding Tour</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm leading-relaxed">
                  Start an interactive step wizard walking through core dashboard widgets, collapsible layouts, and AI panels.
                </p>
              </div>
              <button
                onClick={() => { setIsTourActive(true); setTourStep(0); }}
                className="flex items-center gap-1.5 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-750"
              >
                <Play size={14} />
                Start Workspace Tour
              </button>
            </div>
          )}

          {activeSubTab === "changelog" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <Info className="text-indigo-650" size={18} />
                Release Updates changelogs
              </h3>
              <div className="space-y-6">
                {changelog.map((ch, idx) => (
                  <div key={idx} className="relative pl-6 border-l dark:border-slate-800 space-y-2 font-semibold">
                    <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-900" />
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-sm dark:text-white font-mono">{ch.version}</h4>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500">{ch.date}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 text-xs">
                      {ch.updates.map((up, i) => (
                        <li key={i} className="leading-relaxed font-medium">{up}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar Support ticket Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-7 space-y-6 h-fit">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="text-indigo-650" size={18} />
            Support Help desk
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Can't find what you need? Drop a message and our support team will follow up within 24 hours.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); toast.success("Support ticket logged successfully!"); e.target.reset(); }} className="space-y-4 text-xs font-semibold">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-450 uppercase">Subject</label>
              <input
                type="text"
                required
                placeholder="Timezone settings issues..."
                className="w-full p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-450 uppercase">Ticket details</label>
              <textarea
                required
                placeholder="Details about request issue..."
                className="w-full p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none h-24 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-bold"
            >
              Submit Ticket
            </button>
          </form>
        </div>

      </div>

      {/* Onboarding Tour Overlay Wizard */}
      {isTourActive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] w-full max-w-sm p-7 space-y-6 shadow-2xl relative">
            
            <button 
              onClick={() => setIsTourActive(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650"
            >
              <X size={18} />
            </button>

            <div className="space-y-4 font-semibold text-center">
              <span className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">
                Tour Step {tourStep + 1} of {tourSteps.length}
              </span>
              <h3 className="text-lg font-bold dark:text-white">{tourSteps[tourStep].title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {tourSteps[tourStep].text}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t dark:border-slate-800">
              <button
                disabled={tourStep === 0}
                onClick={() => setTourStep(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={handleNextTourStep}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                {tourStep === tourSteps.length - 1 ? "Complete" : "Next"}
              </button>
            </div>

          </div>
        </div>
      )}

    </AppLayout>
  );
}
