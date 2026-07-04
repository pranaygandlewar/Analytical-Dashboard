import { useEffect, useState } from "react";
import api from "../services/api";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import RevenueChart from "../components/Charts/RevenueChart";
import ActivityChart from "../components/Charts/ActivityChart";
import TeamTable from "../components/TeamTable";
import ActivityFeed from "../components/ActivityFeed";
import AIInsights from "../components/AIInsights";
import useAuthStore from "../store/authStore";
import {
  SkeletonCard,
  SkeletonWideCard,
} from "../components/SkeletonLoader";

function DashboardSkeleton({ role }) {
  return (
    <>
      <div
        className={`grid gap-5 mt-8 ${
          role === "admin"
            ? "grid-cols-5"
            : "grid-cols-4"
        }`}
      >
        {Array.from({
          length: role === "admin" ? 5 : 4,
        }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <SkeletonWideCard />
        <SkeletonWideCard />
      </div>

      {role === "admin" && (
        <>
          <div className="grid grid-cols-2 gap-6 mt-8">
            <SkeletonWideCard />
            <SkeletonWideCard />
          </div>

          <div className="mt-8">
            <SkeletonWideCard />
          </div>
        </>
      )}
    </>
  );
}

function AdminView({ tasks, members }) {
  const completed = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pending = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const completionRate = tasks.length
    ? `${Math.round(
        (completed / tasks.length) * 100
      )}%`
    : "0%";

  const todayStr = new Date().toISOString().split("T")[0];

  const overdueCount = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.due_date &&
      task.due_date < todayStr
  ).length;

  const dueTodayCount = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.due_date &&
      task.due_date === todayStr
  ).length;

  const highPriorityCount = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.priority === "High"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed" && task.completed_at && task.created_at
  );

  let avgCompletionTime = "N/A";
  if (completedTasks.length > 0) {
    const totalMs = completedTasks.reduce((sum, task) => {
      const start = new Date(task.created_at);
      const end = new Date(task.completed_at);
      return sum + (end - start);
    }, 0);
    const avgHrs = Math.round(totalMs / 3600000);
    if (avgHrs < 24) {
      avgCompletionTime = `${avgHrs} hrs`;
    } else {
      const avgDays = Math.round(avgHrs / 24);
      avgCompletionTime = `${avgDays} days`;
    }
  }

  return (
    <>
      <div className="grid grid-cols-5 gap-5 mt-8">
        <StatCard
          title="Total Task"
          value={tasks.length}
        />
        <StatCard
          title="Completed"
          value={completed}
        />
        <StatCard
          title="Pending"
          value={pending}
          positive={false}
          growth="-4.2%"
        />
        <StatCard
          title="Team Members"
          value={members.length}
        />
        <StatCard
          title="Completion Rate"
          value={completionRate}
        />
      </div>

      <div className="grid grid-cols-4 gap-5 mt-5">
        <StatCard
          title="Overdue Tasks"
          value={overdueCount}
          positive={overdueCount === 0}
        />
        <StatCard
          title="Due Today"
          value={dueTodayCount}
          positive={dueTodayCount === 0}
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount}
          positive={false}
        />
        <StatCard
          title="Avg Completion"
          value={avgCompletionTime}
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <RevenueChart tasks={tasks} />
        <ActivityChart tasks={tasks} />
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <ActivityFeed />
        <TeamTable members={members} />
      </div>

      <div className="mt-8">
        <AIInsights tasks={tasks} members={members} />
      </div>
    </>
  );
}

function MemberView({ tasks, members }) {
  const completed = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pending = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const performance = tasks.length
    ? `${Math.round(
        (completed / tasks.length) * 100
      )}%`
    : "0%";

  const todayStr = new Date().toISOString().split("T")[0];

  const overdueCount = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.due_date &&
      task.due_date < todayStr
  ).length;

  const dueTodayCount = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.due_date &&
      task.due_date === todayStr
  ).length;

  const highPriorityCount = tasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.priority === "High"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed" && task.completed_at && task.created_at
  );

  let avgCompletionTime = "N/A";
  if (completedTasks.length > 0) {
    const totalMs = completedTasks.reduce((sum, task) => {
      const start = new Date(task.created_at);
      const end = new Date(task.completed_at);
      return sum + (end - start);
    }, 0);
    const avgHrs = Math.round(totalMs / 3600000);
    if (avgHrs < 24) {
      avgCompletionTime = `${avgHrs} hrs`;
    } else {
      const avgDays = Math.round(avgHrs / 24);
      avgCompletionTime = `${avgDays} days`;
    }
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-5 mt-8">
        <StatCard
          title="My Tasks"
          value={tasks.length}
        />
        <StatCard
          title="Completed"
          value={completed}
        />
        <StatCard
          title="Pending"
          value={pending}
          positive={false}
          growth="-2.1%"
        />
        <StatCard
          title="Performance"
          value={performance}
        />
      </div>

      <div className="grid grid-cols-4 gap-5 mt-5">
        <StatCard
          title="Overdue Tasks"
          value={overdueCount}
          positive={overdueCount === 0}
        />
        <StatCard
          title="Due Today"
          value={dueTodayCount}
          positive={dueTodayCount === 0}
        />
        <StatCard
          title="High Priority"
          value={highPriorityCount}
          positive={false}
        />
        <StatCard
          title="Avg Completion"
          value={avgCompletionTime}
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <ActivityChart tasks={tasks} />
        <ActivityFeed />
      </div>

      <div className="mt-8">
        <AIInsights tasks={tasks} members={members} />
      </div>
    </>
  );
}

function Dashboard() {
  const user = useAuthStore(
    (state) => state.user
  );

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tasks"),
      api.get("/users"),
    ])
      .then(([tasksRes, usersRes]) => {
        setTasks(tasksRes.data);

        const onlyMembers =
          usersRes.data.filter(
            (user) => user.role === "member"
          );

        setMembers(onlyMembers);
      })
      .catch(console.log)
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      });
  }, []);

  return (
    <AppLayout>
      {loading ? (
        <DashboardSkeleton
          role={user?.role}
        />
      ) : (
        <>
          {user?.role === "admin" && (
            <AdminView
              tasks={tasks}
              members={members}
            />
          )}

          {user?.role === "member" && (
            <MemberView tasks={tasks} members={members} />
          )}
        </>
      )}
    </AppLayout>
  );
}

export default Dashboard;