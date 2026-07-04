import { Inbox } from "lucide-react";

export default function EmptyState({ 
  title = "No datasets found", 
  description = "No items have been posted to this workspace list yet.", 
  icon: Icon = Inbox 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 py-14 text-center bg-slate-50/50 dark:bg-slate-900/30 border border-dashed dark:border-slate-800 rounded-3xl">
      <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
        <Icon size={22} />
      </div>
      <h4 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">{title}</h4>
      <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}
