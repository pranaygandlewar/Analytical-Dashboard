import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Plus, 
  Trash2, 
  LogOut, 
  Check, 
  Building2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../services/api";
import Avatar from "./Avatar";
import toast from "react-hot-toast";

function Topbar() {
  const user = useAuthStore((state) => state.user);
  const switchAccount = useAuthStore((state) => state.switchAccount);
  const removeAccount = useAuthStore((state) => state.removeAccount);
  const logoutCurrent = useAuthStore((state) => state.logoutCurrent);
  const logoutAll = useAuthStore((state) => state.logoutAll);
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const loadSessions = () => {
    try {
      const data = localStorage.getItem("teampulse_sessions");
      setSessions(data ? JSON.parse(data) : []);
    } catch {
      setSessions([]);
    }
  };

  const fetchUnreadNotifications = () => {
    if (!user) return;
    api.get("/notifications")
      .then((res) => {
        const unread = res.data.filter(
          (n) => n.is_read === false || n.is_read === "false"
        ).length;
        setUnreadCount(unread);
      })
      .catch(console.log);
  };

  useEffect(() => {
    loadSessions();
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user, dropdownOpen]);

  // Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: N -> Notifications
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === "n") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
          return;
        }
        navigate("/notifications");
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  const handleSwitch = (email) => {
    switchAccount(email);
    setDropdownOpen(false);
    toast.success(`Switched account context successfully!`);
  };

  const handleRemove = (e, email) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove the session for ${email}?`)) {
      removeAccount(email);
      loadSessions();
      toast.success("Account session removed.");
    }
  };

  const handleAddAccount = () => {
    navigate("/login");
    setDropdownOpen(false);
  };

  const triggerSearchPalette = () => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  };

  const activeEmail = user?.email;
  const switchableSessions = sessions.filter(s => s.user.email !== activeEmail);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] px-7 py-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-all duration-300">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          Dashboard
        </p>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Welcome back, {user?.name || "User"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Compact Search Button */}
        <div className="relative group">
          <button 
            onClick={triggerSearchPalette}
            className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-750 transition active:scale-95"
            title="Search (Ctrl + K)"
          >
            <Search
              size={18}
              className="text-slate-600 dark:text-slate-300"
            />
          </button>
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-md">
            Search (Ctrl + K)
          </div>
        </div>

        {/* Notifications Button */}
        <button 
          onClick={() => navigate("/notifications")}
          className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-750 transition active:scale-95 relative"
          title="Notifications (N)"
        >
          <Bell
            size={18}
            className="text-slate-600 dark:text-slate-300"
          />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          )}
        </button>

        {/* User profile dropdown container */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 transition-all duration-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
          >
            <Avatar user={user} size="sm" />

            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {user?.name || "User"}
              </p>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                {user?.role}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-slate-500 dark:text-slate-400 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </div>

          {/* Account switching dropdown modal */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-5 z-55 animate-fadeIn space-y-4">
              
              {/* Profile options list */}
              <div className="space-y-1 pb-3 border-b dark:border-slate-850 text-xs font-bold flex flex-col">
                {[
                  { label: "My Profile", path: "/settings?tab=profile" },
                  { label: "Settings", path: "/settings" },
                  { label: "Billing & Ledger", path: "/settings?tab=billing" },
                  { label: "Help Center", path: "/help" }
                ].map(link => (
                  <button
                    key={link.label}
                    onClick={() => {
                      navigate(link.path);
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-2xl text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              {/* Active Account section */}
              <div className="space-y-3 pb-3 border-b dark:border-slate-850">
                <span className="text-[9px] font-black uppercase text-indigo-650 tracking-wider">
                  Active Account
                </span>
                
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border dark:border-slate-800">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar user={user} size="sm" />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{user?.name}</h4>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold truncate mt-0.5">{user?.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-150 text-indigo-650 font-black dark:bg-indigo-950/40 dark:border-indigo-900/30 dark:text-indigo-400 uppercase">
                          {user?.role}
                        </span>
                        <span className="text-[8px] flex items-center gap-0.5 font-bold text-slate-400">
                          <Building2 size={8} /> TeamPulse Workspace
                        </span>
                      </div>
                    </div>
                  </div>
                  <Check size={16} className="text-emerald-500 shrink-0" />
                </div>
              </div>

              {/* Saved sessions switchable accounts */}
              <div className="space-y-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  Switch Account
                </span>

                {switchableSessions.length === 0 ? (
                  <p className="text-[10px] font-semibold text-slate-400 py-1">No other active accounts signed in.</p>
                ) : (
                  <div className="space-y-2.5 max-h-36 overflow-y-auto">
                    {switchableSessions.map((session) => (
                      <div 
                        key={session.user.email}
                        onClick={() => handleSwitch(session.user.email)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/65 cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Avatar user={session.user} size="xs" />
                          <div className="overflow-hidden">
                            <h5 className="font-bold text-xs text-slate-800 dark:text-white truncate">{session.user.name}</h5>
                            <p className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold truncate">{session.user.email}</p>
                          </div>
                        </div>

                        <button 
                          onClick={(e) => handleRemove(e, session.user.email)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition"
                          title="Remove saved account session"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Another Account CTA */}
                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-white text-xs font-bold rounded-2xl transition active:scale-[0.98]"
                >
                  <Plus size={14} />
                  <span>Add Another Account</span>
                </button>
              </div>

              {/* Logout Options section */}
              <div className="pt-3.5 border-t dark:border-slate-850 space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  Session Control
                </span>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <button 
                    onClick={logoutCurrent}
                    className="py-2.5 border dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={11} />
                    Current
                  </button>

                  <button 
                    onClick={logoutAll}
                    className="py-2.5 bg-red-500/10 hover:bg-red-550 hover:text-white border border-red-500/25 text-red-500 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={11} />
                    All Accounts
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Topbar;