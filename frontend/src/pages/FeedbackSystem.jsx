import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { Star, MessageSquare, AlertTriangle, Lightbulb, ClipboardList, CheckCircle } from "lucide-react";

export default function FeedbackSystem() {
  const currentUser = useAuthStore(state => state.user);
  const [category, setCategory] = useState("feature"); // bug, feature, general
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Admin view datasets
  const [adminFeedbacks, setAdminFeedbacks] = useState([]);

  const loadFeedbacks = async () => {
    if (currentUser?.role === "admin") {
      try {
        const res = await api.get("/feedback");
        setAdminFeedbacks(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    document.title = "Workspace Feedback Center - TeamPulse";
    loadFeedbacks();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter feedback description content");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/feedback", {
        category,
        rating: Number(rating),
        content
      });
      toast.success("Thank you! Feedback logged successfully.");
      setContent("");
      setRating(5);
      loadFeedbacks();
    } catch (err) {
      toast.error("Failed to submit feedback data");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mt-8 mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Feedback Center</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Report bugs, suggest custom feature scopes, or rate the workspace experience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Container */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-7 h-fit space-y-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-indigo-650" size={18} />
            Submit Feedback
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-bold">Feedback Category</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "bug", label: "Bug Report", icon: AlertTriangle, color: "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40" },
                  { id: "feature", label: "Feature Suggest", icon: Lightbulb, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40" },
                  { id: "general", label: "General Rate", icon: Star, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40" }
                ].map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                        active 
                          ? cat.color 
                          : "border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-400 bg-slate-50 dark:bg-slate-800"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-[9px] font-bold uppercase">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stars rating */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-bold">App experience score</label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const starVal = idx + 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className="text-slate-300 dark:text-slate-700 hover:scale-110 transition shrink-0"
                    >
                      <Star 
                        size={22} 
                        fill={starVal <= rating ? "#F59E0B" : "none"} 
                        className={starVal <= rating ? "text-amber-500" : "text-slate-300 dark:text-slate-700"}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descriptions */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-bold">Description details</label>
              <textarea
                placeholder="Describe bug details or suggestion scope..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white outline-none h-32 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition shadow-sm"
            >
              {submitting ? "Submitting..." : "Submit feedback"}
            </button>
          </form>
        </div>

        {/* Feedback List (Admin only or General insights for user) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-7 space-y-6">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-indigo-650" size={18} />
            {currentUser?.role === "admin" ? "All Logged Feedbacks" : "Your Feedback Contributions"}
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {currentUser?.role === "admin" ? (
              adminFeedbacks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium">No feedback logs found in database.</div>
              ) : (
                adminFeedbacks.map((f) => (
                  <div key={f.id} className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border dark:border-slate-800 rounded-2xl space-y-2 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="dark:text-white font-bold">{f.user_name}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          f.category === "bug" ? "bg-red-50 text-red-600" : f.category === "feature" ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                        }`}>
                          {f.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: f.rating || 5 }).map((_, i) => (
                          <Star key={i} size={11} fill="#F59E0B" className="text-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.content}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ""}</p>
                  </div>
                ))
              )
            ) : (
              <div className="p-6 bg-slate-50/50 dark:bg-slate-850/40 rounded-2xl text-center space-y-4">
                <CheckCircle className="text-emerald-500 mx-auto" size={32} />
                <h4 className="font-bold text-slate-800 dark:text-white">Your voice shape the workspace</h4>
                <p className="text-[11px] text-slate-450 leading-relaxed font-semibold max-w-xs mx-auto">
                  Administrators actively review feedbacks to map out priorities for future updates and release cycles.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </AppLayout>
  );
}
