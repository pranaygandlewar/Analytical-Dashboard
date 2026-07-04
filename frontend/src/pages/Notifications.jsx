import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Users,
  AlertTriangle,
  FolderKanban,
  Trash2,
  X,
  CheckCheck,
} from "lucide-react";
import {
  SkeletonWideCard,
} from "../components/SkeletonLoader";

function NotificationsSkeleton() {
  return (
    <div className="space-y-6 mt-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonWideCard key={i} />
      ))}
    </div>
  );
}

// Map categories to style specs (icon, color, bg background)
function getCategoryStyle(category) {
  switch (category) {
    case "Task Assigned":
      return {
        icon: FolderKanban,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-100 dark:bg-indigo-950/40",
        border: "border-indigo-200 dark:border-indigo-900/50"
      };
    case "Task Updated":
      return {
        icon: Clock3,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-100 dark:bg-amber-950/40",
        border: "border-amber-200 dark:border-amber-900/50"
      };
    case "Task Completed":
      return {
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-100 dark:bg-emerald-950/40",
        border: "border-emerald-200 dark:border-emerald-900/50"
      };
    case "Team Activity":
      return {
        icon: Users,
        color: "text-cyan-600 dark:text-cyan-400",
        bg: "bg-cyan-100 dark:bg-cyan-950/40",
        border: "border-cyan-200 dark:border-cyan-900/50"
      };
    case "System Alert":
    default:
      return {
        icon: AlertTriangle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-950/40",
        border: "border-red-200 dark:border-red-900/50"
      };
  }
}

// Relative time calculator helper
function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffMs = now - date;
  
  // Guard for future time drift
  if (diffMs < 0) return "Just now";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Notifications() {
  const user = useAuthStore((state) => state.user);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingNote, setDeletingNote] = useState(null);

  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const highlightId = queryParams.get("highlight");

  const isUnread = (note) =>
    note.is_read === false ||
    note.is_read === "false";

  const fetchNotifications = () => {
    api
      .get("/notifications")
      .then((res) => {
        // Sort notifications: Unread first, then newest (by ID) first
        const sorted = res.data.sort((a, b) => {
          const aUnread = isUnread(a);
          const bUnread = isUnread(b);
          if (aUnread !== bUnread) {
            return aUnread ? -1 : 1;
          }
          return b.id - a.id;
        });

        setNotifications(sorted);
      })
      .catch(console.log)
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      });
  };

  // Scroll to and highlight targeted note card
  useEffect(() => {
    if (highlightId && !loading && notifications.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`note-card-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-4", "ring-indigo-500", "dark:ring-indigo-400");
          const timer = setTimeout(() => {
            element.classList.remove("ring-4", "ring-indigo-500", "dark:ring-indigo-400");
          }, 3000);
          return () => clearTimeout(timer);
        }
      }, 400);
    }
  }, [highlightId, loading, notifications]);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (id) => {
    api
      .put(`/notifications/${id}`)
      .then(() => {
        setNotifications((prev) =>
          prev.map((note) =>
            note.id === id
              ? { ...note, is_read: "true" }
              : note
          )
        );
        toast.success("Notification marked as read");
      })
      .catch(console.log);
  };

  const markAllAsRead = () => {
    api
      .put("/notifications")
      .then(() => {
        setNotifications((prev) =>
          prev.map((note) => ({ ...note, is_read: "true" }))
        );
        toast.success("All notifications marked as read");
      })
      .catch(console.log);
  };

  const deleteNotification = (id) => {
    api
      .delete(`/notifications/${id}`)
      .then(() => {
        setNotifications((prev) => prev.filter((note) => note.id !== id));
        toast.success("Notification deleted");
        setDeletingNote(null);
      })
      .catch(console.log);
  };

  const unreadCount = notifications.filter(
    isUnread
  ).length;

  return (
    <AppLayout>
      <div className="mt-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Notifications
          </h1>

          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Real-time alerts and updates
          </p>
        </div>

        <div className="flex items-center gap-4">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 px-6 py-4 rounded-3xl font-semibold transition duration-300"
            >
              <CheckCheck size={18} />
              Mark All Read
            </button>
          )}

          <div className="bg-indigo-600 text-white px-6 py-4 rounded-3xl font-semibold shadow-lg">
            {unreadCount} Unread
          </div>
        </div>
      </div>

      {loading ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center mt-8">
          <Bell
            size={50}
            className="mx-auto text-slate-300 dark:text-slate-600"
          />

          <h2 className="text-2xl font-bold mt-5 text-slate-900 dark:text-white">
            No Notifications
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mt-3">
            New alerts will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-8">
          <AnimatePresence initial={false}>
            {notifications.map((note) => {
              const style = getCategoryStyle(note.category);
              const Icon = style.icon;
              const unread = isUnread(note);

              return (
                <motion.div
                  key={note.id}
                  id={`note-card-${note.id}`}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`bg-white dark:bg-slate-900 rounded-[32px] border shadow-sm p-7 flex items-center justify-between transition-all duration-300 ${
                    unread
                      ? `border-indigo-300 dark:border-indigo-800/80 ring-2 ring-indigo-50 dark:ring-indigo-950/20`
                      : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-5 min-w-0 flex-1 mr-4">
                    <div
                      className={`w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 ${style.bg}`}
                    >
                      <Icon
                        size={24}
                        className={style.color}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                          {note.category || "System Alert"}
                        </span>
                        
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          {formatRelativeTime(note.created_at)}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 mt-2 font-medium leading-relaxed break-words text-sm md:text-[15px]">
                        {note.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {unread ? (
                      <button
                        onClick={() =>
                          markAsRead(note.id)
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-md shadow-indigo-600/10"
                      >
                        Mark Read
                      </button>
                    ) : (
                      <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-4 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider">
                        Read
                      </div>
                    )}

                    <button
                      onClick={() => setDeletingNote(note)}
                      className="bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-3.5 rounded-2xl transition duration-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-[480px] shadow-2xl border dark:border-slate-800 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-500" />
            </div>

            <h2 className="text-2xl font-bold mt-6 dark:text-white">Delete Notification?</h2>

            <p className="text-slate-500 dark:text-slate-400 mt-3">This action cannot be undone.</p>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setDeletingNote(null)}
                className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 py-4 rounded-2xl font-semibold dark:text-white transition"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteNotification(deletingNote.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}