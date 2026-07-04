import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import TaskDetailsBlock from "../components/TaskDetailsBlock";
import CustomSelect from "../components/CustomSelect";
import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import {
  SkeletonTaskCard,
} from "../components/SkeletonLoader";

function getStatusBadge(status) {
  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-4 py-2 rounded-2xl text-sm font-semibold">
        <CheckCircle2 size={16} />
        Completed
      </div>
    );
  }

  if (status === "in progress") {
    return (
      <div className="flex items-center gap-2 bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-4 py-2 rounded-2xl text-sm font-semibold">
        <Clock3 size={16} />
        In Progress
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-4 py-2 rounded-2xl text-sm font-semibold">
      <AlertCircle size={16} />
      Pending
    </div>
  );
}

function MyTasksSkeleton() {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonTaskCard key={i} />
      ))}
    </div>
  );
}

export default function MyTasks() {
  const user = useAuthStore((state) => state.user);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const highlightId = queryParams.get("highlight");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Filter & Sort State
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueSoon");

  // Scroll to and highlight task card if query param is set
  useEffect(() => {
    if (highlightId && !loading && tasks.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`task-card-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-4", "ring-indigo-500", "dark:ring-indigo-400");
          const timer = setTimeout(() => {
            element.classList.remove("ring-4", "ring-indigo-500", "dark:ring-indigo-400");
          }, 3000);
          return () => clearTimeout(timer);
        }
      }, 300);
    }
  }, [highlightId, loading, tasks]);

  const fetchTasks = () => {
    api
      .get("/tasks")
      .then((res) => {
        const myTasks = res.data.filter(
          (task) => task.assigned_to === user?.id
        );

        setTasks(myTasks);
      })
      .catch(console.log)
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      });
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const markCompleted = (taskId) => {
    setUpdatingTaskId(taskId);

    api
      .put(`/tasks/${taskId}`, {
        status: "completed",
      })
      .then(() => {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: "completed",
                }
              : task
          )
        );

        toast.success("Task marked completed");
      })
      .catch(console.log)
      .finally(() => {
        setUpdatingTaskId(null);
      });
  };

  const getFilteredAndSortedTasks = () => {
    let result = [...tasks];
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Filter by Priority
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // 2. Filter by Due Date
    if (dueDateFilter !== "all") {
      result = result.filter((t) => {
        if (!t.due_date) return false;
        if (dueDateFilter === "overdue") {
          return t.status !== "completed" && t.due_date < todayStr;
        }
        if (dueDateFilter === "dueToday") {
          return t.status !== "completed" && t.due_date === todayStr;
        }
        if (dueDateFilter === "upcoming") {
          return t.status !== "completed" && t.due_date > todayStr;
        }
        return true;
      });
    }

    // 3. Filter by Status
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === "dueSoon") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      if (sortBy === "highestPriority") {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        const wA = priorityWeight[a.priority] || 2;
        const wB = priorityWeight[b.priority] || 2;
        return wB - wA;
      }
      if (sortBy === "recentlyCreated") {
        return b.id - a.id;
      }
      if (sortBy === "alphabetical") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  };

  const processedTasks = getFilteredAndSortedTasks();

  return (
    <AppLayout>
      <div className="mt-8 mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          My Tasks
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage your assigned work efficiently
        </p>
      </div>

      {/* Filter and Sort Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 mb-8 flex flex-wrap items-center justify-between gap-4 text-sm font-medium">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Priority</span>
            <CustomSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "all", label: "All Priorities" },
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" }
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Due Date</span>
            <CustomSelect
              value={dueDateFilter}
              onChange={setDueDateFilter}
              options={[
                { value: "all", label: "All Dates" },
                { value: "overdue", label: "Overdue" },
                { value: "dueToday", label: "Due Today" },
                { value: "upcoming", label: "Upcoming" }
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Status</span>
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "in progress", label: "In Progress" },
                { value: "completed", label: "Completed" }
              ]}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[170px]">
          <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Sort By</span>
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "dueSoon", label: "Due Soon" },
              { value: "highestPriority", label: "Highest Priority" },
              { value: "recentlyCreated", label: "Recently Created" },
              { value: "alphabetical", label: "Alphabetical" }
            ]}
          />
        </div>
      </div>

      {loading ? (
        <MyTasksSkeleton />
      ) : processedTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-10 text-center shadow-sm border border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            No Tasks Found
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mt-3">
            Try adjusting your filters or wait for new assignments
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {processedTasks.map((task) => (
            <div
              key={task.id}
              id={`task-card-${task.id}`}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-7 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {task.title}
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                {getStatusBadge(task.status)}
              </div>

              <TaskDetailsBlock task={task} />

              <div className="mt-8">
                {task.status !== "completed" ? (
                  <button
                    onClick={() =>
                      markCompleted(task.id)
                    }
                    disabled={
                      updatingTaskId === task.id
                    }
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                  >
                    <CheckCheck size={18} />

                    {updatingTaskId === task.id
                      ? "Updating..."
                      : "Mark Completed"}
                  </button>
                ) : (
                  <div className="w-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 py-4 rounded-2xl text-center font-semibold">
                    Task Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}