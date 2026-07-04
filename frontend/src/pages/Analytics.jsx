import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import CustomDatePicker from "../components/CustomDatePicker";
import CustomSelect from "../components/CustomSelect";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend, 
  AreaChart, 
  Area 
} from "recharts";
import {
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Activity,
  UserCheck,
  Bell,
  PlusCircle,
  HelpCircle,
  Inbox
} from "lucide-react";
import { SkeletonCard, SkeletonWideCard } from "../components/SkeletonLoader";

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 mt-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonWideCard />
        <SkeletonWideCard />
      </div>
      <SkeletonWideCard />
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Date Filtering states
  const [dateFilter, setDateFilter] = useState("last30"); // today, last7, last30, thisMonth, custom
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, usersRes, notesRes] = await Promise.all([
          api.get("/tasks"),
          api.get("/users"),
          api.get("/notifications")
        ]);
        setTasks(tasksRes.data);
        setMembers(usersRes.data);
        setNotifications(notesRes.data);
      } catch (err) {
        toast.error("Failed to load analytics datasets");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return tasks.filter((t) => {
      if (!t.created_at) return true; // Keep legacy tasks
      const createdDate = new Date(t.created_at);
      
      switch (dateFilter) {
        case "today":
          return createdDate >= today;
        case "last7":
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return createdDate >= sevenDaysAgo;
        case "thisMonth":
          return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
        case "custom":
          let matches = true;
          if (customStartDate) {
            matches = matches && createdDate >= new Date(customStartDate);
          }
          if (customEndDate) {
            const endOfDay = new Date(customEndDate);
            endOfDay.setHours(23, 59, 59, 999);
            matches = matches && createdDate <= endOfDay;
          }
          return matches;
        case "last30":
        default:
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
      }
    });
  };

  const filteredTasks = getFilteredTasks();

  // 1. KPI Computations
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in progress").length;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === "completed" || !t.due_date) return false;
    return t.due_date < todayStr;
  }).length;

  const highPriorityTasks = filteredTasks.filter((t) => t.priority === "High").length;
  
  const teamProductivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  
  // Average completion time (in days)
  const getAverageCompletionTime = () => {
    const completedWithDates = filteredTasks.filter((t) => t.status === "completed" && t.completed_at && t.created_at);
    if (completedWithDates.length === 0) return "N/A";
    
    const totalDays = completedWithDates.reduce((sum, t) => {
      const start = new Date(t.created_at);
      const end = new Date(t.completed_at);
      const diff = Math.max(0, end - start) / (1000 * 60 * 60 * 24); // diff in days
      return sum + diff;
    }, 0);
    
    const avg = totalDays / completedWithDates.length;
    return avg < 1 ? `${Math.round(avg * 24)}h` : `${avg.toFixed(1)}d`;
  };

  const avgCompletionTime = getAverageCompletionTime();
  const activeMembersCount = members.length;
  const totalNotesCount = notifications.length;
  
  const tasksCreatedToday = tasks.filter((t) => {
    if (!t.created_at) return false;
    return t.created_at.split("T")[0] === todayStr;
  }).length;

  // 2. Charts Data Generation
  
  // A. Status Distribution (Pie)
  const statusPieData = [
    { name: "Completed", value: completedTasks, color: "#10B981" },
    { name: "In Progress", value: inProgressTasks, color: "#F59E0B" },
    { name: "Pending", value: pendingTasks, color: "#94A3B8" }
  ].filter(d => d.value > 0);

  // B. Tasks by Priority (Donut)
  const priorityDonutData = [
    { name: "High", value: filteredTasks.filter((t) => t.priority === "High").length, color: "#EF4444" },
    { name: "Medium", value: filteredTasks.filter((t) => t.priority === "Medium" || !t.priority).length, color: "#F97316" },
    { name: "Low", value: filteredTasks.filter((t) => t.priority === "Low").length, color: "#22C55E" }
  ].filter(d => d.value > 0);

  // C. Weekly Completion Trend (Line)
  const getWeeklyTrend = () => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      return {
        dateStr: d.toISOString().split("T")[0],
        label: daysOfWeek[d.getDay()],
        Completed: 0
      };
    });

    filteredTasks.forEach((t) => {
      if (t.status === "completed" && t.completed_at) {
        const compDate = t.completed_at.split("T")[0];
        const match = last7Days.find(day => day.dateStr === compDate);
        if (match) match.Completed++;
      }
    });

    return last7Days;
  };

  const weeklyTrendData = getWeeklyTrend();

  // D. Monthly Productivity (Bar)
  const getMonthlyProductivity = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const data = months.map((m, idx) => ({
      name: m,
      monthIdx: idx,
      Completed: 0
    }));

    filteredTasks.forEach((t) => {
      if (t.status === "completed" && t.completed_at) {
        const compDate = new Date(t.completed_at);
        if (compDate.getFullYear() === currentYear) {
          data[compDate.getMonth()].Completed++;
        }
      }
    });

    return data;
  };

  const monthlyProductivityData = getMonthlyProductivity();

  // E. Tasks per Team Member (Horizontal Bar)
  const getTasksPerMember = () => {
    return members.map((m) => {
      const assigned = filteredTasks.filter(t => t.assigned_to === m.id).length;
      return {
        name: m.name.split(" ")[0], // Use shortname
        Tasks: assigned
      };
    }).sort((a, b) => b.Tasks - a.Tasks).slice(0, 8); // Top 8 members
  };

  const memberTasksData = getTasksPerMember();

  // F. Tasks Creation vs Completion Timeline (Area)
  const getTimelineArea = () => {
    // Generate dates timeline for the last 10 days
    const last10Days = Array.from({ length: 10 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (9 - idx));
      return {
        dateStr: d.toISOString().split("T")[0],
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        Created: 0,
        Completed: 0
      };
    });

    filteredTasks.forEach((t) => {
      if (t.created_at) {
        const createDate = t.created_at.split("T")[0];
        const match = last10Days.find(day => day.dateStr === createDate);
        if (match) match.Created++;
      }
      if (t.status === "completed" && t.completed_at) {
        const compDate = t.completed_at.split("T")[0];
        const match = last10Days.find(day => day.dateStr === compDate);
        if (match) match.Completed++;
      }
    });

    return last10Days;
  };

  const timelineData = getTimelineArea();

  // 3. Team Performance calculations
  const getTeamPerformance = () => {
    return members.map((m) => {
      const mTasks = filteredTasks.filter(t => t.assigned_to === m.id);
      const total = mTasks.length;
      const completed = mTasks.filter(t => t.status === "completed").length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      const overdue = mTasks.filter(t => {
        if (t.status === "completed" || !t.due_date) return false;
        return t.due_date < todayStr;
      }).length;

      // Avg Completion Time in hours for this member
      const completedWithDates = mTasks.filter(t => t.status === "completed" && t.completed_at && t.created_at);
      let avgTime = "N/A";
      if (completedWithDates.length > 0) {
        const sumHrs = completedWithDates.reduce((sum, t) => {
          const hours = (new Date(t.completed_at) - new Date(t.created_at)) / (1000 * 60 * 60);
          return sum + Math.max(0, hours);
        }, 0);
        const avg = sumHrs / completedWithDates.length;
        avgTime = avg < 24 ? `${Math.round(avg)}h` : `${(avg / 24).toFixed(1)}d`;
      }

      return {
        ...m,
        total,
        completed,
        rate,
        overdue,
        avgTime
      };
    });
  };

  const teamPerformance = getTeamPerformance();

  // Most Productive & Least Active Member computations
  const getProductiveMembersInfo = () => {
    if (teamPerformance.length === 0) return { mostProductive: "N/A", leastActive: "N/A" };
    
    const sortedByCompleted = [...teamPerformance].sort((a, b) => b.completed - a.completed);
    const sortedByTotal = [...teamPerformance].sort((a, b) => a.total - b.total);
    
    return {
      mostProductive: sortedByCompleted[0]?.completed > 0 ? sortedByCompleted[0].name : "N/A",
      leastActive: sortedByTotal[0]?.total > 0 ? sortedByTotal[0].name : "N/A"
    };
  };

  const { mostProductive, leastActive } = getProductiveMembersInfo();

  // 4. Dynamic Productivity Insights Generation
  const generateInsights = () => {
    const insights = [];
    if (totalTasks === 0) {
      return ["No tasks recorded in this timeframe to generate analytics insights."];
    }

    // Insight 1: Team Productivity trend
    if (teamProductivity >= 70) {
      insights.push(`High productivity efficiency! The team has resolved ${teamProductivity}% of assigned tasks.`);
    } else if (teamProductivity >= 40) {
      insights.push(`Moderate velocity. Completion rate sits at ${teamProductivity}%. Plan sprint reviews.`);
    } else {
      insights.push(`Productivity velocity is critical (${teamProductivity}%). Recommend reviewing bottleneck blockers.`);
    }

    // Insight 2: Bottlenecks
    const bottleneckMember = [...teamPerformance].sort((a, b) => (a.total - a.completed) - (b.total - b.completed))[0];
    if (bottleneckMember && (bottleneckMember.total - bottleneckMember.completed) > 2) {
      insights.push(`Bottleneck alert: ${bottleneckMember.name} has ${bottleneckMember.total - bottleneckMember.completed} pending tasks. Reassigning workloads might be useful.`);
    }

    // Insight 3: High risk & Overdue
    if (overdueTasks > 0) {
      insights.push(`Overdue warning: There are ${overdueTasks} active tasks past their due dates. Re-evaluate deadlines.`);
    }
    
    if (highPriorityTasks > 0) {
      const pendingHigh = filteredTasks.filter(t => t.priority === "High" && t.status !== "completed").length;
      if (pendingHigh > 0) {
        insights.push(`High risk: ${pendingHigh} High Priority tasks are currently active. Prioritize their progress.`);
      }
    }

    // Default insight if empty
    if (insights.length === 0) {
      insights.push("Team workloads are healthy and balanced across active members.");
    }
    return insights;
  };

  const insights = generateInsights();

  // 5. Exports Engine
  const handleExportCSV = () => {
    if (filteredTasks.length === 0) {
      toast.error("No tasks data to export.");
      return;
    }
    let headers = ["Task ID", "Title", "Assigned To Name", "Status", "Priority", "Due Date", "Created At", "Completed At"];
    let rows = filteredTasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(members.find(m => m.id === t.assigned_to)?.name || "Unassigned").replace(/"/g, '""')}"`,
      t.status,
      t.priority || "Medium",
      t.due_date || "",
      t.created_at || "",
      t.completed_at || ""
    ]);
    let csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    let blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `teampulse_analytics_${dateFilter}_export.csv`);
    link.click();
    toast.success("CSV export successfully generated!");
  };

  const handleExportExcel = () => {
    if (filteredTasks.length === 0) {
      toast.error("No tasks data to export.");
      return;
    }
    let headers = ["Task ID\tTitle\tAssigned To Name\tStatus\tPriority\tDue Date\tCreated At\tCompleted At"];
    let rows = filteredTasks.map(t => [
      t.id,
      t.title,
      members.find(m => m.id === t.assigned_to)?.name || "Unassigned",
      t.status,
      t.priority || "Medium",
      t.due_date || "",
      t.created_at || "",
      t.completed_at || ""
    ].join("\t"));
    let excelContent = [headers, ...rows].join("\n");
    let blob = new Blob([excelContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `teampulse_analytics_${dateFilter}_export.xls`);
    link.click();
    toast.success("Excel sheet export successfully generated!");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <AppLayout>
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-8 no-print">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Workspace Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Real-time metrics, workloads, and team performance breakdowns</p>
        </div>

        {/* Export options */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 dark:text-white text-sm font-semibold transition"
          >
            <Download size={15} />
            CSV
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 dark:text-white text-sm font-semibold transition"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>

          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold transition"
          >
            <FileText size={15} />
            Print PDF
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 mt-6 mb-8 flex flex-wrap items-center justify-between gap-4 text-sm font-medium no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Timeframe</span>
            <CustomSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: "today", label: "Today" },
                { value: "last7", label: "Last 7 Days" },
                { value: "last30", label: "Last 30 Days" },
                { value: "thisMonth", label: "This Month" },
                { value: "custom", label: "Custom Range" }
              ]}
            />
          </div>

          {dateFilter === "custom" && (
            <>
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Start Date</span>
                <CustomDatePicker value={customStartDate} onChange={setCustomStartDate} />
              </div>
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">End Date</span>
                <CustomDatePicker value={customEndDate} onChange={setCustomEndDate} />
              </div>
            </>
          )}
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-500">
          Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredTasks.length}</span> tasks in range.
        </div>
      </div>

      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="space-y-8">
          {/* KPI Dashboard Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total Tasks</p>
                <h3 className="text-2xl font-extrabold text-slate-850 dark:text-white mt-2">{totalTasks}</h3>
              </div>
              <div className="h-11 w-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                <Activity size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Completed</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{completedTasks}</h3>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Overdue Warning</p>
                <h3 className="text-2xl font-extrabold text-red-500 mt-2">{overdueTasks}</h3>
              </div>
              <div className="h-11 w-11 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
                <AlertCircle size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Productivity Velocity</p>
                <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{teamProductivity}%</h3>
              </div>
              <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600">
                <Zap size={20} />
              </div>
            </div>
          </div>

          {/* KPI Dashboard Row 2 (Secondary metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">In Progress</span>
              <p className="text-lg font-bold text-amber-500 mt-1">{inProgressTasks}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pending</span>
              <p className="text-lg font-bold text-slate-500 mt-1">{pendingTasks}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">High Priority</span>
              <p className="text-lg font-bold text-red-500 mt-1">{highPriorityTasks}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Avg Time Resolve</span>
              <p className="text-lg font-bold text-indigo-500 dark:text-indigo-400 mt-1">{avgCompletionTime}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Active Members</span>
              <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{activeMembersCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Created Today</span>
              <p className="text-lg font-bold text-indigo-650 dark:text-indigo-300 mt-1">{tasksCreatedToday}</p>
            </div>
          </div>

          {/* KPI Dashboard Row 3 (Interactive Charts) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Chart 1: Status Distribution (Pie) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-[360px]">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Status Distribution</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tasks spread across status phases</p>
              </div>
              <div className="h-[220px]">
                {statusPieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    <Inbox size={24} className="mr-2" />
                    No Tasks in filter.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Priority Distribution (Donut) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-[360px]">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Priority Allocation</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Workload density by task priority</p>
              </div>
              <div className="h-[220px]">
                {priorityDonutData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    <Inbox size={24} className="mr-2" />
                    No Tasks in filter.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityDonutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {priorityDonutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Tasks per Team Member (Horizontal Bar) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-[360px]">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Workload by Member</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tasks assigned per developer</p>
              </div>
              <div className="h-[220px]">
                {memberTasksData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">
                    <Inbox size={24} className="mr-2" />
                    No Members data.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberTasksData} layout="vertical" margin={{ left: 15, right: 15 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="Tasks" fill="#6366F1" radius={[0, 8, 8, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* KPI Dashboard Row 4 (Line & Bar charts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 4: Weekly Task Completion Trend (Line) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-[360px]">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Weekly Completion Trend</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Count of tasks completed in the last 7 days</p>
              </div>
              <div className="h-[220px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrendData}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Completed" stroke="#10B981" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Monthly Productivity (Bar Chart) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-[360px]">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Monthly Productivity</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tasks completed per month in current year</p>
              </div>
              <div className="h-[220px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyProductivityData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Completed" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Task Creation vs Completion Timeline (Area) */}
            <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between h-[380px]">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Timeline Velocity (Creation vs Completion)</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Comparison of incoming vs resolved tasks in the last 10 days</p>
              </div>
              <div className="h-[240px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="Created" stroke="#6366F1" fillOpacity={0.15} fill="url(#colorCreated)" strokeWidth={3} />
                    <Area type="monotone" dataKey="Completed" stroke="#10B981" fillOpacity={0.15} fill="url(#colorCompleted)" strokeWidth={3} />
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Productivity Insights */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 mt-8 no-print">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Zap className="text-indigo-600" size={20} />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Health Insights</h2>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase mt-3">Dynamic recommendations generated from active workloads</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {insights.map((insight, idx) => {
                let colorClass = "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50";
                if (insight.includes("warning") || insight.includes("overdue")) {
                  colorClass = "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/50";
                } else if (insight.includes("bottleneck") || insight.includes("critical")) {
                  colorClass = "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/50";
                } else if (insight.includes("productivity") || insight.includes("efficiency")) {
                  colorClass = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50";
                }
                return (
                  <div key={idx} className={`rounded-3xl p-5 border text-sm font-semibold transition ${colorClass}`}>
                    {insight}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Performance Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-7 mt-8 overflow-hidden">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Team Velocity & Output</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-450 dark:text-slate-500 font-bold uppercase text-xs">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Job Title</th>
                    <th className="py-3 px-4">Assigned Tasks</th>
                    <th className="py-3 px-4">Completed Tasks</th>
                    <th className="py-3 px-4">Completion Rate</th>
                    <th className="py-3 px-4">Overdue Tasks</th>
                    <th className="py-3 px-4">Avg Completion Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {teamPerformance.map((member) => (
                    <tr key={member.id} className="text-slate-800 dark:text-slate-200">
                      <td className="py-4 px-4 font-bold">{member.name}</td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{member.job_title || "Developer"}</td>
                      <td className="py-4 px-4 font-semibold">{member.total}</td>
                      <td className="py-4 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{member.completed}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{member.rate}%</span>
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${member.rate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className={`py-4 px-4 font-bold ${member.overdue > 0 ? "text-red-500" : "text-slate-500"}`}>
                        {member.overdue}
                      </td>
                      <td className="py-4 px-4 font-semibold">{member.avgTime}</td>
                    </tr>
                  ))}
                  {teamPerformance.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400 dark:text-slate-500 font-semibold">
                        No team members data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}