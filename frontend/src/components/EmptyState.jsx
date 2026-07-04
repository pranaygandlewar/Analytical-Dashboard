import { FolderPlus, UserPlus, FilePlus, BellRing, Sparkles } from "lucide-react";

export default function EmptyState({ type, title, description, actionText, onAction }) {
  const renderIcon = () => {
    switch (type) {
      case "tasks":
        return <FilePlus className="text-indigo-600 dark:text-indigo-400 h-10 w-10 animate-bounce" />;
      case "projects":
        return <FolderPlus className="text-purple-600 dark:text-purple-400 h-10 w-10 animate-pulse" />;
      case "team":
        return <UserPlus className="text-emerald-600 dark:text-emerald-400 h-10 w-10" />;
      case "notifications":
        return <BellRing className="text-amber-600 dark:text-amber-400 h-10 w-10 animate-pulse" />;
      default:
        return <Sparkles className="text-indigo-600 dark:text-indigo-400 h-10 w-10" />;
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center text-center p-8 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100 dark:border-slate-850 rounded-[32px] shadow-sm py-12 max-w-xl mx-auto space-y-5 animate-fadeIn">
      <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center shadow-sm border dark:border-slate-800">
        {renderIcon()}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-450 dark:text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-650 hover:from-indigo-700 hover:to-purple-750 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 transition active:scale-[0.98]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
