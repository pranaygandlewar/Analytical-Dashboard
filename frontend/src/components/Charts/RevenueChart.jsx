import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

function RevenueChart({ tasks }) {
  const completed = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pending = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const data = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];

  const COLORS = ["#4F46E5", "#334155"];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-7 h-[420px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Task Overview
          </h3>

          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Completion analytics
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {tasks.length}
          </p>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Tasks
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={90}
            outerRadius={130}
            dataKey="value"
            paddingAngle={6}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;