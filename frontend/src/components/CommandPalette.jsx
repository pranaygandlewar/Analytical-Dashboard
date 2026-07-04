import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  FolderKanban,
  BarChart3,
  Bell,
  CheckSquare,
  Settings,
  Search,
  Clock,
  User,
  Activity,
  Server,
  AlertTriangle,
  TrendingUp,
  Moon,
  Trash2,
} from "lucide-react";

// Static Page Options
const getStaticPages = (role) => {
  const pages = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard, subtitle: "View system metrics and overview stats", category: "Pages" },
    { label: "Settings", path: "/settings", icon: Settings, subtitle: "Configure account preferences and theme settings", category: "Pages" },
    { label: "Dark Mode Settings", path: "/settings", icon: Moon, subtitle: "Settings - Toggle light and dark app appearance", category: "Pages" },
    { label: "Notification Settings", path: "/settings", icon: Bell, subtitle: "Settings - Manage platform email and push alerts", category: "Pages" },
  ];

  if (role === "admin") {
    pages.push(
      { label: "Admin Panel", path: "/admin", icon: ShieldCheck, subtitle: "Admin - Task creator and operations manager", category: "Pages" },
      { label: "Team Management", path: "/team", icon: Users, subtitle: "Admin - Add, delete, and list team members", category: "Pages" },
      { label: "Projects Board", path: "/projects", icon: FolderKanban, subtitle: "Admin - Drag-and-drop Kanban task view", category: "Pages" },
      { label: "Analytics Stats", path: "/analytics", icon: BarChart3, subtitle: "Admin - CPU usage, server load, and growth charts", category: "Pages" },
      { label: "API Requests Metric", path: "/analytics", icon: Server, subtitle: "Analytics - API requests throughput", category: "Pages" },
      { label: "Active Sessions Metric", path: "/analytics", icon: Activity, subtitle: "Analytics - Live user session logs", category: "Pages" },
      { label: "Error Rate Metric", path: "/analytics", icon: AlertTriangle, subtitle: "Analytics - Platform error rate overview", category: "Pages" },
      { label: "System Growth Metric", path: "/analytics", icon: TrendingUp, subtitle: "Analytics - Performance growth charts", category: "Pages" }
    );
  } else {
    pages.push(
      { label: "My Tasks", path: "/tasks", icon: CheckSquare, subtitle: "Member - View and update your assigned tasks", category: "Pages" }
    );
  }

  pages.push(
    { label: "Notifications Logs", path: "/notifications", icon: Bell, subtitle: "View alerts and real-time inbox messages", category: "Pages" }
  );

  return pages;
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Dynamic state loaded on open
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Recent Searches state
  const [recentSearches, setRecentSearches] = useState([]);

  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("teampulse_recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reading recent searches", e);
    }
  }, []);

  // Toggle Command Palette on Ctrl/Cmd + K & custom event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const handleOpenEvent = () => {
      setIsOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, []);

  // Reset state and fetch data on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      // Fetch latest tasks, users, notifications in parallel
      if (user) {
        setLoading(true);
        Promise.all([
          api.get("/tasks").catch(() => ({ data: [] })),
          api.get("/users").catch(() => ({ data: [] })),
          api.get("/notifications").catch(() => ({ data: [] })),
        ])
          .then(([tasksRes, usersRes, notesRes]) => {
            setTasks(tasksRes.data);
            setMembers(usersRes.data);
            setNotifications(notesRes.data);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      }

      return () => clearTimeout(timer);
    }
  }, [isOpen, user]);

  // Compute all searchable items
  const getSearchableItems = () => {
    const items = [];

    // 1. Pages, Analytics, Settings
    items.push(...getStaticPages(user?.role));

    // 2. Tasks
    tasks.forEach((task) => {
      // Find assignee name
      const assignee = members.find((m) => m.id === task.assigned_to)?.name || "Unassigned";
      items.push({
        label: task.title,
        subtitle: `Status: ${task.status} | Assigned to: ${assignee} - ${task.description}`,
        path: user?.role === "admin" ? `/admin?highlight=${task.id}` : `/tasks?highlight=${task.id}`,
        icon: CheckSquare,
        category: "Tasks",
        id: task.id,
      });
    });

    // 3. Team Members
    members.forEach((member) => {
      items.push({
        label: member.name,
        subtitle: `Role: ${member.role} | Email: ${member.email}`,
        path: "/team",
        icon: User,
        category: "Team Members",
        id: member.id,
      });
    });

    // 4. Notifications
    notifications.forEach((note) => {
      items.push({
        label: "Alert notification",
        subtitle: note.message,
        path: `/notifications?highlight=${note.id}`,
        icon: Bell,
        category: "Notifications",
        id: note.id,
      });
    });

    return items;
  };

  // Filtered items based on query
  const searchableItems = getSearchableItems();
  const filteredItems = search
    ? searchableItems.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Determine current items list displayed to user
  const displayItems = search
    ? filteredItems
    : recentSearches.map((q) => ({
        label: q,
        subtitle: "Search query history",
        isRecentQuery: true,
        path: "",
        icon: Clock,
        category: "Recent Searches",
      }));

  // Handle keyboard events when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          displayItems.length ? (prev + 1) % displayItems.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          displayItems.length
            ? (prev - 1 + displayItems.length) % displayItems.length
            : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (displayItems.length > 0 && selectedIndex < displayItems.length) {
          const selected = displayItems[selectedIndex];
          if (selected.isRecentQuery) {
            setSearch(selected.label);
          } else {
            handleSelect(selected);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, displayItems, selectedIndex]);

  // Handle item selection (Save to localstorage and navigate)
  const handleSelect = (item) => {
    // Save to recents if there was a typed search query
    if (search.trim()) {
      const query = search.trim();
      const updated = [query, ...recentSearches.filter((q) => q !== query)].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem("teampulse_recent_searches", JSON.stringify(updated));
    }

    navigate(item.path);
    setIsOpen(false);
  };

  // Clear single recent search item
  const clearRecent = (e, q) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== q);
    setRecentSearches(updated);
    localStorage.setItem("teampulse_recent_searches", JSON.stringify(updated));
  };

  // Close when clicking outside modal
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  // Reset selected index when view mode changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Helper to group items by category
  const getGroupedItems = () => {
    const groups = {};
    displayItems.forEach((item, index) => {
      const cat = item.category;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push({ ...item, globalIndex: index });
    });
    return groups;
  };

  const groupedItems = getGroupedItems();

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] px-4"
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-[680px] bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <Search className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={22} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search pages, tasks, members, notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none border-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-semibold text-lg"
              />
              <span className="flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                ESC
              </span>
            </div>

            {/* Results Body */}
            <div className="p-3 max-h-[420px] overflow-y-auto space-y-4">
              {loading && displayItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                  Loading data...
                </div>
              ) : displayItems.length === 0 ? (
                <div className="py-12 text-center">
                  <Search size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg">No results found</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    No matches found for "{search}". Try searching for something else.
                  </p>
                </div>
              ) : (
                Object.keys(groupedItems).map((categoryName) => (
                  <div key={categoryName} className="space-y-1">
                    {/* Category Label */}
                    <div className="px-4 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {categoryName}
                    </div>

                    {/* Group Items */}
                    {groupedItems[categoryName].map((item) => {
                      const Icon = item.icon;
                      const isSelected = item.globalIndex === selectedIndex;

                      return (
                        <div
                          key={item.isRecentQuery ? `recent-${item.label}` : `${item.path}-${item.label}-${item.id || ""}`}
                          onClick={() => {
                            if (item.isRecentQuery) {
                              setSearch(item.label);
                            } else {
                              handleSelect(item);
                            }
                          }}
                          onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                          className={`group flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 scale-[1.002]"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-indigo-500 dark:text-indigo-400"
                              }`}
                            >
                              <Icon size={18} className={isSelected ? "text-white" : ""} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm truncate leading-snug">
                                {item.label}
                              </h4>
                              <p
                                className={`text-xs truncate mt-0.5 ${
                                  isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {item.isRecentQuery ? (
                              <button
                                onClick={(e) => clearRecent(e, item.label)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isSelected ? "hover:bg-white/20 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  isSelected
                                    ? "bg-white/30 text-white"
                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                }`}
                              >
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-medium">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigation</span>
                <span>Enter Select</span>
                <span>ESC Cancel</span>
              </div>
              <div>
                <span>CTRL + K to toggle</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
