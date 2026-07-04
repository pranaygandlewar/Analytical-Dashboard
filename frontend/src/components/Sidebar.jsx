import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  Bell,
  LogOut,
  ShieldCheck,
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Menu,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "../store/authStore";
import api from "../services/api";
import Avatar from "./Avatar";

function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, companyName, companyLogo }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotifications = () => {
    if (!user) return;

    api
      .get("/notifications")
      .then((res) => {
        const unread = res.data.filter(
          (n) =>
            n.is_read === false ||
            n.is_read === "false"
        ).length;

        setUnreadCount(unread);
      })
      .catch(console.log);
  };

  useEffect(() => {
    if (!user) return;

    fetchUnreadNotifications();

    const interval = setInterval(
      fetchUnreadNotifications,
      3000
    );

    return () => clearInterval(interval);
  }, [user]);


  let menu = [];

  if (user?.role === "admin") {
    menu = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: ShieldCheck, label: "Admin Panel", path: "/admin" },
      { icon: Users, label: "Team", path: "/team" },
      { icon: FolderKanban, label: "Projects", path: "/projects" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: HelpCircle, label: "Help Center", path: "/help" },
      { icon: MessageSquare, label: "Feedback", path: "/feedback" }
    ];
  }

  if (user?.role === "member") {
    menu = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: CheckSquare, label: "My Tasks", path: "/tasks" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: HelpCircle, label: "Help Center", path: "/help" },
      { icon: MessageSquare, label: "Feedback", path: "/feedback" }
    ];
  }

  return (
    <div 
      id="sidebar-tour"
      className={`${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed lg:static left-0 top-0 bottom-0 z-50 ${
        isCollapsed ? "lg:w-24 lg:px-4" : "lg:w-80 lg:px-7"
      } w-80 bg-[#0B1235] dark:bg-black text-white h-full px-7 py-8 flex flex-col justify-between overflow-y-auto transition-all duration-300 border-r dark:border-slate-900`}
    >
      <div>
        {/* Sidebar Header (Logo & Collapse toggle) */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={companyLogo || "/logo.png"} alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-lg shrink-0" />

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="whitespace-nowrap"
              >
                <h1 className="text-2xl font-bold">{companyName || "TeamPulse"}</h1>
                <p className="text-slate-400 text-sm">Workspace</p>
              </motion.div>
            )}
          </div>

          {/* Collapse toggle button for large screens */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-8 w-8 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg items-center justify-center transition"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Menu list */}
        <div className="space-y-2.5">
          {menu.map((item, i) => {
            const Icon = item.icon;

            return (
              <NavLink 
                key={i} 
                to={item.path} 
                id={`${item.label.toLowerCase().replace(" ", "-")}-tour`}
                className="block"
                onClick={() => setIsMobileOpen(false)}
              >
                {({ isActive }) => (
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 shadow-[0_0_25px_rgba(99,102,241,0.25)]"
                      />
                    )}

                    <div
                      className={`relative z-10 flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      } ${isCollapsed ? "justify-center" : ""}`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon size={20} className="shrink-0" />
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-medium whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </div>

                      {!isCollapsed && item.label === "Notifications" && unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User settings */}
      <div className="space-y-4">
        <div className={`bg-white/5 rounded-3xl p-4 border border-white/10 flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <Avatar user={user} size="xs" className="shrink-0" />
          
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <p className="text-slate-450 text-[10px] uppercase font-bold tracking-wider">
                Logged in as
              </p>
              <p className="font-bold text-sm truncate mt-0.5">
                {user?.name}
              </p>
              <p className="text-indigo-300 uppercase text-[10px] font-bold mt-0.5">
                {user?.role}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;