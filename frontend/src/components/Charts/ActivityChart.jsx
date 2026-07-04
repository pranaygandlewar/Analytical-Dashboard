import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ActivityChart({ tasks }) {
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-7 h-[420px]">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Productivity Analytics
        </h3>

        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Performance breakdown
        </p>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8" }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "16px",
              color: "#ffffff",
            }}
            labelStyle={{
              color: "#ffffff",
            }}
          />

          <Bar
            dataKey="value"
            fill="#4F46E5"
            radius={[18, 18, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ActivityChart;