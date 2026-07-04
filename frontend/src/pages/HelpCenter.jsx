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
import { ProductTour } from "../components/OnboardingSystem";

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
          { id: "faq", label: "FAQs & Tutorials", icon: Play },
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
            <div className="space-y-6 flex flex-col items-center justify-center py-10 text-center animate-fadeIn">
              <Compass className="text-indigo-600 animate-spin duration-3000" size={48} />
              <div className="space-y-2">
                <h3 className="font-bold text-lg dark:text-white">Workspace Guided Tour</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-sm leading-relaxed">
                  Restart the interactiveguided product tour highlighting core layout headers, Kanban board, AI drawers, and settings.
                </p>
              </div>
              <button
                onClick={() => setIsTourActive(true)}
                className="flex items-center gap-1.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition active:scale-[0.98]"
              >
                <Play size={14} fill="white" />
                Start Tour Walkthrough
              </button>
            </div>
          )}

          {activeSubTab === "faq" && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <Play className="text-indigo-650" size={18} />
                FAQs & Video Tutorials
              </h3>
              
              {/* Tutorials Grid (Mockups) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Quickstart Dashboard Navigation", duration: "2:45 min", desc: "A brief tour explaining stats cards, activity feeds, and NLP assistant features." },
                  { title: "Roles and Permissions Configurations", duration: "4:15 min", desc: "How admins can manage security matrices and invite workspace team members." }
                ].map((vid, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/20 border dark:border-slate-850 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl mb-3 flex items-center justify-center relative group cursor-pointer border dark:border-slate-700">
                      <div className="h-10 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-105 transition">
                        <Play size={14} fill="white" className="ml-0.5" />
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        {vid.duration}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs dark:text-white">{vid.title}</h4>
                      <p className="text-slate-450 dark:text-slate-500 text-[10px] font-semibold mt-1">{vid.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQs Accordion */}
              <div className="border-t dark:border-slate-800 pt-6 space-y-4">
                <h4 className="font-bold text-sm dark:text-white">Frequently Asked Questions</h4>
                <div className="space-y-2">
                  {[
                    { q: "How do I upgrade my plan?", a: "Navigate to Settings -> Billing & Subscription tab, choose your billing cycle, and click Upgrade Plan. You can complete the sandbox payment using any demo UPI app." },
                    { q: "How does the AI Productivity Assistant work?", a: "Click the floating bot button in the bottom-right corner. It supports plain language commands like 'create a task for next Monday' or workspace statistics checkins." }
                  ].map((faq, idx) => (
                    <details key={idx} className="bg-slate-50 dark:bg-slate-800/10 border dark:border-slate-850 p-4 rounded-2xl group cursor-pointer">
                      <summary className="font-bold text-xs text-slate-800 dark:text-slate-200 flex justify-between items-center outline-none list-none">
                        <span>{faq.q}</span>
                        <ChevronRight className="transform group-open:rotate-90 transition-transform" size={14} />
                      </summary>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-2.5 leading-relaxed">
                        {faq.a}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
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
      <ProductTour
        active={isTourActive}
        onFinish={() => { setIsTourActive(false); toast.success("Walkthrough completed!"); }}
        onSkipTour={() => setIsTourActive(false)}
      />

    </AppLayout>
  );
}
