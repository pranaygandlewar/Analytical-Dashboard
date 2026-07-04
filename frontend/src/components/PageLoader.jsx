import { Bot } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center min-h-[400px] text-slate-800 dark:text-white">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 rounded-full border-4 border-indigo-150 border-t-indigo-650 animate-spin" />
        <Bot size={22} className="absolute text-indigo-600 animate-pulse" />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Syncing Workspace Datasets...
      </p>
    </div>
  );
}
