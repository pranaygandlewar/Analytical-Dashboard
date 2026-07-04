export function SkeletonCard() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/70 dark:via-slate-700/40 to-transparent" />

      <div className="space-y-4">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-10 w-24 bg-slate-300 dark:bg-slate-600 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonTaskCard() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] p-7 border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/70 dark:via-slate-700/40 to-transparent" />

      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-300 dark:bg-slate-600 rounded-xl animate-pulse" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-12 w-full bg-slate-300 dark:bg-slate-600 rounded-2xl animate-pulse mt-6" />
      </div>
    </div>
  );
}

export function SkeletonWideCard() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[320px]">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/70 dark:via-slate-700/40 to-transparent" />

      <div className="space-y-5">
        <div className="h-6 w-52 bg-slate-300 dark:bg-slate-600 rounded-xl animate-pulse" />
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse mt-8" />
      </div>
    </div>
  );
}