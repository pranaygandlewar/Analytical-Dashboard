import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

function StatCard({
  title,
  value,
  positive = true,
  growth = "+12.4%",
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 min-w-[220px]">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
          {title}
        </p>

        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          {positive ? (
            <TrendingUp
              size={18}
              className="text-emerald-500"
            />
          ) : (
            <TrendingDown
              size={18}
              className="text-red-500"
            />
          )}
        </div>
      </div>

      <h2 className="text-4xl font-bold text-slate-900 dark:text-white mt-5">
        {value}
      </h2>

      <p
        className={`mt-3 text-sm font-medium ${
          positive
            ? "text-emerald-500"
            : "text-red-500"
        }`}
      >
        {growth}
      </p>
    </div>
  );
}

export default StatCard;