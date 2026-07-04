import {
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import Avatar from "./Avatar";

function Topbar() {
  const user = useAuthStore((state) => state.user);

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
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 dark:text-white text-sm transition-all duration-300"
          />
        </div>

        <button className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition">
          <Bell
            size={18}
            className="text-slate-600 dark:text-slate-300"
          />
        </button>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 transition-all duration-300">
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
            className="text-slate-500 dark:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}

export default Topbar;