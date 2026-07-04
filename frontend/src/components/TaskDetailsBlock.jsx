import { Calendar, AlertCircle, Clock } from "lucide-react";

export default function TaskDetailsBlock({ task }) {
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
      case "Low":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "Medium":
      default:
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
    }
  };

  const getDueDateInfo = () => {
    if (!task.due_date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isCompleted = task.status === "completed";

    if (isCompleted) {
      return {
        label: `Completed (Due: ${task.due_date})`,
        color: "text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
        overdue: false,
      };
    }

    if (diffDays < 0) {
      return {
        label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`,
        color: "text-red-600 dark:text-red-400 font-bold",
        badge: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 animate-pulse",
        overdue: true,
      };
    }

    if (diffDays === 0) {
      return {
        label: "Due Today",
        color: "text-amber-600 dark:text-amber-400 font-semibold",
        badge: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
        overdue: false,
      };
    }

    if (diffDays === 1) {
      return {
        label: "Due Tomorrow",
        color: "text-slate-500 dark:text-slate-400",
        badge: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
        overdue: false,
      };
    }

    return {
      label: `Due in ${diffDays} days`,
      color: "text-slate-500 dark:text-slate-400",
      badge: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
      overdue: false,
    };
  };

  const getProgressPercentage = () => {
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter((s) => s.completed).length;
      return Math.round((completed / task.subtasks.length) * 100);
    }

    switch (task.status) {
      case "completed":
        return 100;
      case "in progress":
        return 50;
      case "pending":
      default:
        return 0;
    }
  };

  const dueDateInfo = getDueDateInfo();
  const progress = getProgressPercentage();
  const priorityStyle = getPriorityStyle(task.priority);

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
      {/* Priority & Duration row */}
      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
        <span className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${priorityStyle}`}>
          {task.priority || "Medium"}
        </span>

        {task.estimated_duration && (
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Clock size={12} />
            Est: {task.estimated_duration}h
          </span>
        )}
      </div>

      {/* Due Date Indicator */}
      {dueDateInfo && (
        <div className={`flex items-center gap-2 text-xs py-1.5 px-3 rounded-xl max-w-max ${dueDateInfo.badge}`}>
          <Calendar size={13} />
          <span>{dueDateInfo.label}</span>
          {dueDateInfo.overdue && <AlertCircle size={13} className="text-red-500 animate-bounce" />}
        </div>
      )}

      {/* Progress Section */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Progress</span>
          <span className="text-slate-600 dark:text-slate-400 font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress === 100
                ? "bg-emerald-500"
                : progress === 50
                ? "bg-indigo-500"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
