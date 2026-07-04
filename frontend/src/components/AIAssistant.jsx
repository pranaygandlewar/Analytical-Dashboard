import { useState, useEffect, useRef } from "react";
import { aiService } from "../services/aiService";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import Avatar from "./Avatar";
import {
  MessageSquare,
  Sparkles,
  X,
  Minus,
  Send,
  Bot,
  Activity,
  FileText,
  AlertTriangle,
  TrendingUp,
  Download,
  Terminal,
  Zap,
  RefreshCw
} from "lucide-react";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I am your TeamPulse Workspace Intelligence AI. Ask me about overdue tasks, workload metrics, or type commands like 'summarize today's activity'!"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  
  // Data sets
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const currentUser = useAuthStore(state => state.user);

  // Advanced feature: reports
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("daily"); // daily, weekly, monthly
  const [reportContent, setReportContent] = useState(null);

  const messagesEndRef = useRef(null);

  const loadData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/users")
      ]);
      setTasks(tasksRes.data);
      setMembers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isMinimized]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal;
    setInputVal("");
    setMessages(prev => [...prev, { sender: "user", text: userText }]);

    // Process NLP command
    const context = { tasks, members, currentUser };
    const response = await aiService.chat(userText, context);

    if (typeof response === "object" && response.action) {
      // Execute command callback payload
      setMessages(prev => [...prev, { sender: "bot", text: response.message }]);
      
      if (response.action === "CREATE_TASK") {
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-800">Assign this AI task?</span>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    try {
                      await api.post("/tasks", {
                        title: response.payload.title,
                        description: response.payload.description,
                        due_date: response.payload.due_date,
                        priority: "Medium",
                        assigned_to: currentUser.id // Assign to self by default
                      });
                      toast.success("Task assigned successfully!");
                      loadData();
                    } catch (err) {
                      toast.error("Failed to assign task");
                    }
                  }}
                  className="bg-indigo-600 text-white px-2.5 py-1 rounded text-[10px] font-bold"
                >
                  Create
                </button>
                <button onClick={() => toast.dismiss(t.id)} className="bg-slate-200 text-slate-800 px-2.5 py-1 rounded text-[10px] font-bold">
                  Dismiss
                </button>
              </div>
            </div>
          ),
          { duration: 6000 }
        );
      }
    } else {
      setMessages(prev => [...prev, { sender: "bot", text: response }]);
    }
  };

  const handleGenerateReport = (type) => {
    setReportType(type);
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const active = tasks.filter(t => t.status !== "completed").length;
    
    // Performance leaders
    const leaders = members.map(m => {
      const uTasks = tasks.filter(t => t.assigned_to === m.id);
      const done = uTasks.filter(t => t.status === "completed").length;
      return { name: m.name, done };
    }).sort((a, b) => b.done - a.done).slice(0, 3);

    // Heuristics summary
    const content = {
      title: `${type.toUpperCase()} WORKSPACE PRODUCTIVITY REPORT`,
      date: new Date().toLocaleDateString(),
      metrics: {
        completed,
        pending,
        active,
        total: tasks.length
      },
      leaders,
      insights: [
        `Workspace health status stands at ${tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 100}% sprint efficiency.`,
        `${active} tasks remain active. Maintain deadlines to prevent scheduling bottlenecks.`,
        "Workloads are distributed across departments."
      ]
    };

    setReportContent(content);
    setShowReportModal(true);
  };

  return (
    <>
      {/* Floating Trigger button in bottom-right */}
      <div className="fixed bottom-6 right-6 z-45 no-print">
        <button
          onClick={() => {
            setIsOpen(prev => !prev);
            setIsMinimized(false);
          }}
          className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-700 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
        </button>
      </div>

      {/* Expandable Chat Drawer (Glassmorphism design) */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] z-45 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col no-print transition-all duration-300">
          
          {/* Header Panel */}
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h4 className="font-extrabold text-xs tracking-wider uppercase">TeamPulse AI</h4>
                <p className="text-[9px] text-indigo-200">Workspace Intelligence Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-white/10 rounded transition text-indigo-100 hover:text-white"
                title="Minimize"
              >
                <Minus size={15} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition text-indigo-100 hover:text-white"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Recommendations & Report Triggers */}
          <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border-b dark:border-slate-800 flex gap-2 overflow-x-auto text-[10px] font-bold">
            <button 
              onClick={() => handleGenerateReport("daily")}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-300 rounded-full border dark:border-indigo-900/50 shrink-0"
            >
              <FileText size={12} />
              Daily Report
            </button>
            <button 
              onClick={() => handleGenerateReport("weekly")}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-300 rounded-full border dark:border-indigo-900/50 shrink-0"
            >
              <FileText size={12} />
              Weekly Report
            </button>
            <button 
              onClick={async () => {
                const overdue = tasks.filter(t => {
                  const today = new Date().toISOString().split("T")[0];
                  return t.status !== "completed" && t.due_date && t.due_date < today;
                });
                setMessages(prev => [
                  ...prev,
                  { sender: "user", text: "Scan overdue tasks" },
                  { sender: "bot", text: overdue.length > 0 
                      ? `Found ${overdue.length} overdue tasks: \n` + overdue.map(t => `- **${t.title}**`).join("\n")
                      : "Workspace is healthy! There are no overdue deadlines." }
                ]);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shrink-0"
            >
              <AlertTriangle size={12} className="text-red-500" />
              Scan Overdue
            </button>
          </div>

          {/* Chat message logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                {msg.sender === "bot" ? (
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 border dark:border-indigo-900/40">
                    <Bot size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                ) : (
                  <Avatar user={currentUser} size="xs" className="shrink-0" />
                )}
                
                <div className={`p-3 rounded-2xl max-w-[80%] font-medium leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200 text-slate-800 rounded-tl-none border dark:border-slate-800"
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form panel */}
          <form onSubmit={handleSend} className="p-3 border-t dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Type commands..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white outline-none text-xs font-semibold"
            />
            <button
              type="submit"
              className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 transition"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Minimized bar option */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-20 right-6 z-45 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 text-xs font-bold no-print cursor-pointer" onClick={() => setIsMinimized(false)}>
          <Bot size={15} className="animate-bounce" />
          <span>TeamPulse AI (Minimized)</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }} 
            className="text-indigo-200 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Reports Export Modal dialog */}
      {showReportModal && reportContent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] w-full max-w-xl p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <h3 className="font-bold text-base dark:text-white">Productivity Report Summary</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-650">
                <X size={18} />
              </button>
            </div>

            {/* Report Content */}
            <div className="space-y-6 font-semibold" id="printable-ai-report">
              <div className="text-center">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">{reportContent.title}</h2>
                <p className="text-[10px] text-slate-400 mt-1">Generated on {reportContent.date} • TeamPulse AI Workspace Analyzer</p>
              </div>

              {/* Statistics grid */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase">Total tasks</span>
                  <p className="text-base font-bold dark:text-white mt-1">{reportContent.metrics.total}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-600">
                  <span className="text-[10px] text-slate-400 uppercase">Completed</span>
                  <p className="text-base font-bold mt-1">{reportContent.metrics.completed}</p>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl text-amber-600">
                  <span className="text-[10px] text-slate-400 uppercase">Pending</span>
                  <p className="text-base font-bold mt-1">{reportContent.metrics.pending}</p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl text-indigo-600">
                  <span className="text-[10px] text-slate-400 uppercase">Active</span>
                  <p className="text-base font-bold mt-1">{reportContent.metrics.active}</p>
                </div>
              </div>

              {/* Leadership leaderboard */}
              <div>
                <h4 className="text-xs text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">Top Productive Developers</h4>
                <div className="space-y-2">
                  {reportContent.leaders.map((leader, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-semibold">
                      <span className="dark:text-white">{idx + 1}. {leader.name}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{leader.done} tasks completed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div>
                <h4 className="text-xs text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2 font-bold">AI Diagnostics & Summary Recommendations</h4>
                <ul className="space-y-2 text-xs">
                  {reportContent.insights.map((insight, idx) => (
                    <li key={idx} className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 rounded-xl border dark:border-indigo-900/50">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t dark:border-slate-800 pt-4 no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
              >
                <Download size={14} />
                Export PDF Report
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 dark:text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
