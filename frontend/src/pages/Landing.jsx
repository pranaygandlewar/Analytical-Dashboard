import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Zap, 
  Activity, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Star,
  Users,
  Lock,
  Globe
} from "lucide-react";
import useAuthStore from "../store/authStore";

export default function Landing() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // Carousel states
  const [activeSlide, setActiveSlide] = useState(0);
  const screenshots = [
    { title: "Task Workspace Board", desc: "Collaborate, tag priorities, and estimate duration metrics effortlessly.", badge: "Tasks" },
    { title: "SaaS Workspace Diagnostics", desc: "Scan bottlenecks, risk ratios, and review workspace health diagnostics instantly.", badge: "AI Summary" },
    { title: "Interactive Recharts Platform", desc: "Track output volumes, timeline velocities, and member output allocations.", badge: "Analytics" }
  ];

  // FAQ Accordion states
  const [expandedFaq, setExpandedFaq] = useState(null);

  // SEO & Head Metadata
  useEffect(() => {
    document.title = "TeamPulse - Unified SaaS Analytics & Project Management Platform";
    
    // Dynamic meta description setup
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Streamline project task controls, aggregate automated productivity diagnostics, and track timelines on TeamPulse.");
    }
  }, []);

  const toggleFaq = (idx) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  const faqs = [
    { q: "What is TeamPulse?", a: "TeamPulse is an enterprise workspace platform offering integrated task checklists, live server resource statistics, role permissions management, and context-based AI helpers." },
    { q: "Can we connect external LLM providers?", a: "Yes. The AI Assistant service features modular abstraction adapters pre-configured to easily link with Gemini, Claude, or OpenAI APIs." },
    { q: "Is there a free trial for the Pro plan?", a: "Our Pro plan includes a 14-day trial period where you can experiment with advanced user settings and bulk updates." },
    { q: "How is workspace security managed?", a: "TeamPulse uses encrypted JWT storage, session verification checkpoints, and admin-controlled permissions matrix sets." }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300"
    >
      
      {/* Header Panel */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b dark:border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-xl object-cover shadow" />
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">TeamPulse</span>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/status" 
            className="text-xs font-bold hover:text-indigo-600 transition"
          >
            System Status
          </Link>
          {isAuthenticated ? (
            <button 
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
            >
              Go to Workspace
            </button>
          ) : (
            <button 
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 text-center max-w-4xl mx-auto px-6 space-y-8 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent)] blur-3xl" />
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900/50">
          <Sparkles size={14} className="animate-spin duration-3000" />
          <span>Velocity, Output, Synergy — Powered by AI</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
          Modern project management <br className="hidden md:inline" />
          with <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">real-time workspace intelligence</span>
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          The task manager designed for high-performance squads. Streamline checklists, scan bottleneck metrics, and deploy custom settings instantly.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <button 
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
            className="flex items-center gap-2 px-7 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5"
          >
            Start Free Workspace
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-100/40 dark:bg-slate-900/20 border-y dark:border-slate-900 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Workspace Feature Set</h2>
            <p className="text-slate-450 dark:text-slate-500 text-sm mt-2">Engineered to support fast collaboration, clean interfaces, and robust stats.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Workspace Status Center", desc: "Dynamic matrices allowing role authorization, security logging, and system health checks.", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
              { icon: Zap, title: "Floating AI Assistance", desc: "Analyze overdue tasks, calculate productivity summaries, and run conversational NLP commands.", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
              { icon: Activity, title: "SaaS Analytics Dashboard", desc: "Plot line graphs, donut priorities, and member outputs directly driven by active SQL data.", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div className={`h-12 w-12 rounded-2xl ${feat.color} flex items-center justify-center mb-6`}>
                    <Icon size={20} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg dark:text-white">{feat.title}</h3>
                    <p className="text-slate-450 dark:text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Screenshot Carousel */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Built for High Velocity</h2>
          <p className="text-slate-450 dark:text-slate-500 text-sm mt-2">See how TeamPulse streamlines daily operations.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] p-6 shadow-xl flex flex-col md:flex-row gap-8 items-center h-auto min-h-[350px]">
          <div className="flex-1 space-y-6">
            {screenshots.map((shot, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  activeSlide === idx 
                    ? "bg-slate-50 dark:bg-slate-800/40 border-indigo-200 dark:border-indigo-900" 
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{shot.badge}</span>
                <h4 className="font-bold text-sm dark:text-white mt-1">{shot.title}</h4>
                <p className="text-[11px] text-slate-450 mt-1">{shot.desc}</p>
              </button>
            ))}
          </div>

          {/* Visual Placeholder for Mockup */}
          <div className="flex-1 bg-slate-950 rounded-2xl h-64 w-full flex items-center justify-center p-8 relative overflow-hidden border dark:border-slate-800">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white,transparent)]" />
            <div className="text-center space-y-3 z-10">
              <Play className="text-indigo-400 mx-auto animate-pulse" size={28} />
              <p className="text-xs font-bold text-white uppercase tracking-wider">{screenshots[activeSlide].title}</p>
              <p className="text-[10px] text-slate-400 max-w-xs">{screenshots[activeSlide].desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section className="py-20 bg-slate-100/40 dark:bg-slate-900/20 border-y dark:border-slate-900 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Workspace Pricing Plans</h2>
            <p className="text-slate-450 dark:text-slate-500 text-sm mt-2">Unlock productivity aggregates and workflow templates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { plan: "Free Starter", price: "$0", features: ["1 Workspace", "Basic task checklists", "Light / Dark theme defaults"], cta: "Start Free", action: () => navigate("/login") },
              { plan: "Pro Analytics", price: "$12", features: ["Unlimited Workspace settings", "SaaS Analytics & charts", "Bulk actions controllers", "Email invitation links"], cta: "Activate Pro", action: () => navigate("/login"), popular: true },
              { plan: "Enterprise Premium", price: "Custom", features: ["Custom role permission matrices", "Direct Neon DB integrations", "99.9% Latency Status checkers", "Priority developer support"], cta: "Contact Sales", action: () => navigate("/login") }
            ].map((tier, idx) => (
              <div key={idx} className={`bg-white dark:bg-slate-900 border ${tier.popular ? "border-indigo-500 shadow-xl" : "dark:border-slate-800"} rounded-[32px] p-8 flex flex-col justify-between relative`}>
                {tier.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow">
                    Most Popular
                  </span>
                )}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-400 text-xs uppercase">{tier.plan}</h4>
                    <h3 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-2">{tier.price} <span className="text-xs font-semibold text-slate-450">/ month</span></h3>
                  </div>
                  <ul className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="text-indigo-500" size={14} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  onClick={tier.action}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold mt-8 transition ${
                    tier.popular 
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow" 
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expandable FAQs Accordion */}
      <section className="py-20 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-950 dark:text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 flex items-center justify-between text-left font-bold text-sm text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                {expandedFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {expandedFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-450 dark:text-slate-500 leading-relaxed font-semibold">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-950 border-t dark:border-slate-900 py-12 px-6 text-center text-xs text-slate-450 font-bold">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-6 w-6 rounded object-cover" />
            <span className="dark:text-white text-sm">TeamPulse</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/status" className="hover:text-indigo-600 transition">System Status</Link>
            <Link to="/help" className="hover:text-indigo-600 transition">Help Center</Link>
          </div>

          <p>© {new Date().getFullYear()} TeamPulse Workspace Inc. All rights reserved.</p>
        </div>
      </footer>

    </motion.div>
  );
}
