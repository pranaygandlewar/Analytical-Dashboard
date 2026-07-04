function ActivityFeed() {
  const activities = [
    "Task 'API Integration' completed",
    "New analytics report uploaded",
    "Task reassigned to frontend team",
    "Backend performance improved",
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-7">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Recent Activity
        </h3>

        <button className="text-indigo-500 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              ⚡
            </div>

            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {item}
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Just now
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;