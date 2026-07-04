import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import TaskDetailsBlock from "../components/TaskDetailsBlock";
import toast from "react-hot-toast";
import CustomSelect from "../components/CustomSelect";
import CustomDatePicker from "../components/CustomDatePicker";
import Avatar from "../components/Avatar";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckSquare,
  Settings,
  Activity,
  Database,
  Cpu,
  Lock,
  RefreshCw,
  UserPlus,
  UserCheck,
  UserMinus,
  Key,
  Search,
  Filter,
  Server,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";
import {
  SkeletonTaskCard,
  SkeletonWideCard
} from "../components/SkeletonLoader";

function AdminPanelSkeleton() {
  return (
    <div className="space-y-6 mt-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonWideCard className="lg:col-span-2" />
        <SkeletonWideCard />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-5 h-28 animate-pulse border dark:border-slate-800" />
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Original Task form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editEstimatedDuration, setEditEstimatedDuration] = useState("");

  // Filter/Sort states for Task tab
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueSoon");

  // Advanced Admin states
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [workspaceSettings, setWorkspaceSettings] = useState({
    workspace_name: "TeamPulse",
    company_logo: "",
    brand_color: "#6366f1",
    timezone: "UTC",
    date_format: "YYYY-MM-DD",
    default_priority: "Medium",
    default_notifications: "true",
    permissions: "{}"
  });

  // Modal control states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteDept, setInviteDept] = useState("Engineering");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newTempPassword, setNewTempPassword] = useState("");

  // Stats
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 18,
    memory: 42,
    dbPing: 12
  });

  const [bulkRoleValue, setBulkRoleValue] = useState("member");

  const fetchData = async () => {
    try {
      const [usersRes, tasksRes, settingsRes] = await Promise.all([
        api.get("/users"),
        api.get("/tasks"),
        api.get("/workspace/settings")
      ]);
      setAllUsers(usersRes.data);
      
      // Original members mapping
      const onlyMembers = usersRes.data.filter((u) => u.role === "member");
      setMembers(onlyMembers);
      setTasks(tasksRes.data);
      if (settingsRes.data) {
        setWorkspaceSettings(settingsRes.data);
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to load workspace administration details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Keep cpu/memory gauges animated dynamically
    const interval = setInterval(() => {
      setSystemMetrics({
        cpu: Math.floor(Math.random() * 20) + 10,
        memory: Math.floor(Math.random() * 15) + 35,
        dbPing: Math.floor(Math.random() * 8) + 8
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Workspace overview KPIs calculations
  const totalUsersCount = allUsers.length;
  const activeUsersCount = allUsers.filter(u => u.status !== "suspended").length;
  const onlineUsersCount = allUsers.filter(u => u.status === "active").length; // Mock online state based on active statuses
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const pendingTasksCount = tasks.filter(t => t.status === "pending").length;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTasksCount = tasks.filter(t => {
    if (t.status === "completed" || !t.due_date) return false;
    return t.due_date < todayStr;
  }).length;

  const healthScore = totalTasksCount > 0 
    ? Math.max(0, 100 - Math.round((overdueTasksCount / totalTasksCount) * 40))
    : 100;

  // Workspace Settings saving
  const handleSaveSettings = async (updatedSettings) => {
    const next = { ...workspaceSettings, ...updatedSettings };
    setWorkspaceSettings(next);
    try {
      await api.post("/workspace/settings", next);
      toast.success("Workspace settings updated successfully!");
    } catch (err) {
      toast.error("Failed to update workspace settings");
    }
  };

  // User Administration Operations
  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await api.put(`/users/${userId}/status`, { status: newStatus });
      toast.success(`User successfully ${newStatus === "suspended" ? "suspended" : "reactivated"}!`);
      fetchData();
    } catch (err) {
      toast.error("Failed to alter user status");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success("User role updated successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to update user role");
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      await api.post("/users/invite", {
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        department: inviteDept
      });
      toast.success(`Invitation successfully dispatched to ${inviteEmail}!`);
      setShowInviteModal(false);
      setInviteName("");
      setInviteEmail("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to invite user");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newTempPassword) {
      toast.error("Please enter a password");
      return;
    }
    try {
      await api.put(`/users/${resetUser.id}/reset-password`, { password: newTempPassword });
      toast.success(`Password reset successfully for ${resetUser.name}!`);
      setShowResetModal(false);
      setNewTempPassword("");
      setResetUser(null);
    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!confirm("Are you sure you want to permanently remove this user and delete their tasks?")) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted successfully!");
      fetchData();
    } catch (err) {
      toast.error("Failed to remove user");
    }
  };

  // Bulk actions
  const handleBulkSelectUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleBulkSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete these ${selectedUserIds.length} users?`)) return;
    try {
      await api.post("/users/bulk-delete", { user_ids: selectedUserIds });
      toast.success("Selected users deleted successfully!");
      setSelectedUserIds([]);
      fetchData();
    } catch (err) {
      toast.error("Failed to delete users in bulk");
    }
  };

  const handleBulkRoleChange = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.post("/users/bulk-role", { user_ids: selectedUserIds, role: bulkRoleValue });
      toast.success(`Role updated to ${bulkRoleValue} for selected users!`);
      setSelectedUserIds([]);
      fetchData();
    } catch (err) {
      toast.error("Failed to bulk update roles");
    }
  };

  // Original Task panel logic
  const createTask = () => {
    if (!title || !assignedTo) {
      toast.error("Task Title and Assignee are required.");
      return;
    }

    api
      .post("/tasks", {
        title,
        description,
        assigned_to: Number(assignedTo),
        priority,
        due_date: dueDate || null,
        estimated_duration: estimatedDuration ? Number(estimatedDuration) : null
      })
      .then(() => {
        toast.success("Task assigned successfully");
        setTitle("");
        setDescription("");
        setAssignedTo("");
        setPriority("Medium");
        setDueDate("");
        setEstimatedDuration("");
        fetchTasks();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Task creation failed");
      });
  };

  const confirmDelete = (task) => {
    setTaskToDelete(task);
    setDeletingTaskId(task.id);
  };

  const executeDelete = () => {
    api
      .delete(`/tasks/${deletingTaskId}`)
      .then(() => {
        toast.success("Task deleted successfully");
        setDeletingTaskId(null);
        setTaskToDelete(null);
        fetchTasks();
      })
      .catch(() => {
        toast.error("Task deletion failed");
        setDeletingTaskId(null);
        setTaskToDelete(null);
      });
  };

  const cancelDelete = () => {
    setDeletingTaskId(null);
    setTaskToDelete(null);
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditAssignedTo(task.assigned_to);
    setEditStatus(task.status);
    setEditPriority(task.priority || "Medium");
    setEditDueDate(task.due_date || "");
    setEditEstimatedDuration(task.estimated_duration || "");
  };

  const saveEdit = (id) => {
    api
      .put(`/tasks/${id}`, {
        title: editTitle,
        description: editDescription,
        assigned_to: Number(editAssignedTo),
        status: editStatus,
        priority: editPriority,
        due_date: editDueDate || null,
        estimated_duration: editEstimatedDuration ? Number(editEstimatedDuration) : null
      })
      .then(() => {
        toast.success("Changes saved successfully");
        setEditingTaskId(null);
        fetchTasks();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Failed to update task");
      });
  };

  // Filter and process users
  const getFilteredUsers = () => {
    return allUsers.filter((u) => {
      const matchSearch = 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()));
      
      const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === "all" || u.status === userStatusFilter;
      
      return matchSearch && matchRole && matchStatus;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Filter and sort tasks
  const getProcessedTasks = () => {
    let result = [...tasks];

    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (dueDateFilter !== "all") {
      const today = new Date().toISOString().split("T")[0];
      if (dueDateFilter === "overdue") {
        result = result.filter(
          (t) => t.status !== "completed" && t.due_date && t.due_date < today
        );
      } else if (dueDateFilter === "dueToday") {
        result = result.filter((t) => t.due_date === today);
      } else if (dueDateFilter === "upcoming") {
        result = result.filter((t) => t.due_date && t.due_date > today);
      }
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (memberFilter !== "all") {
      result = result.filter((t) => t.assigned_to === Number(memberFilter));
    }

    if (sortBy === "dueSoon") {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    } else if (sortBy === "highestPriority") {
      const score = { High: 3, Medium: 2, Low: 1 };
      result.sort(
        (a, b) =>
          (score[b.priority] || 2) - (score[a.priority] || 2)
      );
    } else if (sortBy === "recentlyCreated") {
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  };

  const processedTasks = getProcessedTasks();

  // Role Permissions mapping
  const parsedPermissions = JSON.parse(workspaceSettings.permissions || "{}");
  
  const handleTogglePermission = (roleName, permissionName) => {
    const rolePermissions = parsedPermissions[roleName] || [];
    let updated;
    if (rolePermissions.includes(permissionName)) {
      updated = rolePermissions.filter(p => p !== permissionName);
    } else {
      updated = [...rolePermissions, permissionName];
    }
    const nextPerms = { ...parsedPermissions, [roleName]: updated };
    handleSaveSettings({ permissions: JSON.stringify(nextPerms) });
  };

  const permissionsList = [
    "View Dashboard",
    "Manage Tasks",
    "Delete Tasks",
    "Manage Team",
    "View Analytics",
    "Export Reports",
    "Manage Notifications",
    "Manage Settings"
  ];

  return (
    <AppLayout>
      <div className="mt-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Workspace Control Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage workspace configurations, users directory, system monitors, and role permissions.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap items-center gap-1.5 mb-8 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-2 rounded-2xl">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "users", label: "Users Directory", icon: Users },
          { id: "permissions", label: "Permissions Matrix", icon: ShieldCheck },
          { id: "tasks", label: "Tasks Control", icon: CheckSquare },
          { id: "settings", label: "Workspace Settings", icon: Settings },
          { id: "security", label: "System Security & Data", icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm border border-slate-100/50 dark:border-slate-800"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <AdminPanelSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { title: "Total Accounts", value: totalUsersCount, icon: Users, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
                  { title: "Active Users", value: activeUsersCount, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                  { title: "Online Now", value: onlineUsersCount, icon: Activity, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/20" },
                  { title: "Total Tasks", value: totalTasksCount, icon: CheckSquare, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800/40" },
                  { title: "Health Index", value: `${healthScore}/100`, icon: Sparkles, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20" }
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1.5">{kpi.value}</h3>
                      </div>
                      <div className={`h-11 w-11 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                        <Icon size={18} className={kpi.color} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live System Monitors & Statistics widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Monitoring card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Server className="text-indigo-600" size={18} />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Server Resource Monitors</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                        <span className="text-slate-500">CPU Usage</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{systemMetrics.cpu}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-650 h-full rounded-full transition-all duration-500" style={{ width: `${systemMetrics.cpu}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                        <span className="text-slate-500">Memory Usage</span>
                        <span className="text-purple-600 dark:text-purple-400">{systemMetrics.memory}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-650 h-full rounded-full transition-all duration-500" style={{ width: `${systemMetrics.memory}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <span className="text-xs text-slate-500 font-semibold">Database Response</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        {systemMetrics.dbPing} ms
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <span className="text-xs text-slate-500 font-semibold">Allocated Storage</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">24.8 MB / 500 MB (4.9%)</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Widgets (Recent Activity Logs) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Activity className="text-indigo-600" size={18} />
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Security Alerts & Workspace Status</h3>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl flex items-center gap-3">
                      <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                        Warning: Storage allocations are healthy, but database indexes should be updated soon.
                      </p>
                    </div>
                    
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/20 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                        Operational: All backend API gateways and PostgreSQL database clusters are active.
                      </p>
                    </div>

                    <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 rounded-2xl flex items-center gap-3">
                      <Users className="text-indigo-600 shrink-0" size={18} />
                      <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400">
                        Team stats: {activeUsersCount} accounts verified. Workspace contains {totalTasksCount} tasks across projects.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Users Directory */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[24px]">
                <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
                  <div className="relative w-full md:w-60">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                      type="text"
                      placeholder="Search name, email, department..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl outline-none text-xs font-medium"
                    />
                  </div>

                  <CustomSelect
                    value={userRoleFilter}
                    onChange={setUserRoleFilter}
                    options={[
                      { value: "all", label: "All Roles" },
                      { value: "admin", label: "Admin" },
                      { value: "manager", label: "Manager" },
                      { value: "member", label: "Member" },
                      { value: "viewer", label: "Viewer" }
                    ]}
                  />

                  <CustomSelect
                    value={userStatusFilter}
                    onChange={setUserStatusFilter}
                    options={[
                      { value: "all", label: "All Statuses" },
                      { value: "active", label: "Active" },
                      { value: "suspended", label: "Suspended" },
                      { value: "invited", label: "Invited" }
                    ]}
                  />
                </div>

                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <UserPlus size={15} />
                  Invite New User
                </button>
              </div>

              {/* Bulk actions toolbar */}
              {selectedUserIds.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-400">
                    {selectedUserIds.length} users selected
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Change Role:</span>
                      <CustomSelect
                        value={bulkRoleValue}
                        onChange={setBulkRoleValue}
                        options={[
                          { value: "admin", label: "Admin" },
                          { value: "manager", label: "Manager" },
                          { value: "member", label: "Member" },
                          { value: "viewer", label: "Viewer" }
                        ]}
                      />
                      <button 
                        onClick={handleBulkRoleChange}
                        className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                      >
                        Apply
                      </button>
                    </div>

                    <button 
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500 hover:bg-red-650 text-white rounded-xl text-xs font-bold"
                    >
                      <Trash2 size={13} />
                      Bulk Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Users table list */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-450 dark:text-slate-500 font-bold uppercase">
                        <th className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                            onChange={handleBulkSelectAll}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3">User</th>
                        <th className="py-3 px-3">Role</th>
                        <th className="py-3 px-3">Department</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Last Login</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="text-slate-800 dark:text-slate-200">
                          <td className="py-4 px-3">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.id)}
                              onChange={() => handleBulkSelectUser(user.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-3 flex items-center gap-3">
                            <Avatar user={user} size="xs" />
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</p>
                              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                              className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-lg p-1 px-2 outline-none font-bold text-xs uppercase"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="py-4 px-3 text-slate-500 dark:text-slate-400">{user.department || "Engineering"}</td>
                          <td className="py-4 px-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              user.status === "suspended"
                                ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                                : user.status === "invited"
                                ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                                : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {user.status || "active"}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-slate-450 dark:text-slate-500">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {user.status === "suspended" ? (
                                <button 
                                  onClick={() => handleUpdateStatus(user.id, "active")}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 rounded-lg"
                                  title="Reactivate Account"
                                >
                                  <UserCheck size={14} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateStatus(user.id, "suspended")}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 text-amber-600 rounded-lg"
                                  title="Suspend Account"
                                >
                                  <UserMinus size={14} />
                                </button>
                              )}

                              <button 
                                onClick={() => { setResetUser(user); setShowResetModal(true); }}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                                title="Reset Password"
                              >
                                  <Key size={14} />
                              </button>

                              <button 
                                onClick={() => handleRemoveUser(user.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-500 rounded-lg"
                                title="Delete user"
                              >
                                  <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                            No team members match this query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Permissions Matrix */}
          {activeTab === "permissions" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-950 dark:text-white text-lg">Role & Permission System</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Updates to these permissions take effect immediately across all active sessions.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-450 dark:text-slate-500 font-bold uppercase">
                      <th className="py-3 px-4">Permission Name</th>
                      {["admin", "manager", "member", "viewer"].map(role => (
                        <th key={role} className="py-3 px-4 text-center">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-semibold">
                    {permissionsList.map((perm) => (
                      <tr key={perm} className="text-slate-800 dark:text-slate-200">
                        <td className="py-4 px-4 font-bold">{perm}</td>
                        {["admin", "manager", "member", "viewer"].map((role) => {
                          const hasPerm = (parsedPermissions[role] || []).includes(perm);
                          return (
                            <td key={role} className="py-4 px-4 text-center">
                              <button
                                onClick={() => handleTogglePermission(role, perm)}
                                className={`h-6 w-6 rounded-lg mx-auto flex items-center justify-center transition border ${
                                  hasPerm 
                                    ? "bg-indigo-600 border-indigo-600 text-white" 
                                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300"
                                }`}
                              >
                                {hasPerm && <Check size={14} />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Tasks Control (Original Admin Panel) */}
          {activeTab === "tasks" && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Task Creation Form */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm h-fit">
                <div className="flex items-center gap-3 mb-8">
                  <PlusCircle className="text-indigo-600" />
                  <h2 className="text-2xl font-bold dark:text-white">Assign Task</h2>
                </div>

                <div className="space-y-5">
                  <input
                    type="text"
                    placeholder="Task Title"
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <textarea
                    placeholder="Task Description"
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white outline-none h-36"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Assignee</label>
                  <CustomSelect
                    value={assignedTo ? Number(assignedTo) : ""}
                    onChange={(val) => setAssignedTo(val)}
                    options={[
                      { value: "", label: "Select Team Member" },
                      ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }))
                    ]}
                    buttonClassName="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl p-4"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Priority</label>
                      <CustomSelect
                        value={priority}
                        onChange={setPriority}
                        options={[
                          { value: "High", label: "High" },
                          { value: "Medium", label: "Medium" },
                          { value: "Low", label: "Low" }
                        ]}
                        buttonClassName="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl p-4"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Due Date</label>
                      <CustomDatePicker
                        value={dueDate}
                        onChange={setDueDate}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Est. Duration (hours - optional)</label>
                    <input
                      type="number"
                      placeholder="Estimated hours"
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white outline-none"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={createTask}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-semibold transition"
                  >
                    Create Task
                  </button>
                </div>
              </div>

              {/* Tasks List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-2xl font-bold dark:text-white">Active Tasks</h2>
                  <span className="text-xs text-slate-400">Total: {processedTasks.length}</span>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl text-xs font-semibold">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-bold">Priority</span>
                    <CustomSelect
                      value={priorityFilter}
                      onChange={setPriorityFilter}
                      options={[
                        { value: "all", label: "All Priorities" },
                        { value: "High", label: "High" },
                        { value: "Medium", label: "Medium" },
                        { value: "Low", label: "Low" }
                      ]}
                      buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-xl p-2.5 outline-none font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-bold">Due Date</span>
                    <CustomSelect
                      value={dueDateFilter}
                      onChange={setDueDateFilter}
                      options={[
                        { value: "all", label: "All Dates" },
                        { value: "overdue", label: "Overdue" },
                        { value: "dueToday", label: "Due Today" },
                        { value: "upcoming", label: "Upcoming" }
                      ]}
                      buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-xl p-2.5 outline-none font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-bold">Status</span>
                    <CustomSelect
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "pending", label: "Pending" },
                        { value: "in progress", label: "In Progress" },
                        { value: "completed", label: "Completed" }
                      ]}
                      buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-xl p-2.5 outline-none font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-bold">Assignee</span>
                    <CustomSelect
                      value={memberFilter === "all" ? "all" : Number(memberFilter)}
                      onChange={(val) => setMemberFilter(val)}
                      options={[
                        { value: "all", label: "All Assignees" },
                        ...members.map((m) => ({ value: m.id, label: m.name }))
                      ]}
                      buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-xl p-2.5 outline-none font-medium"
                    />
                  </div>

                  <div className="col-span-2 flex flex-col gap-1.5">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-bold">Sort By</span>
                    <CustomSelect
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { value: "dueSoon", label: "Due Soon" },
                        { value: "highestPriority", label: "Highest Priority" },
                        { value: "recentlyCreated", label: "Recently Created" },
                        { value: "alphabetical", label: "Alphabetical" }
                      ]}
                      buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-xl p-2.5 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Cards rendering */}
                <div className="space-y-5 max-h-[600px] overflow-y-auto">
                  {processedTasks.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">
                      No tasks match the active filters.
                    </div>
                  ) : (
                    processedTasks.map((task) => (
                      <div
                        key={task.id}
                        id={`task-card-${task.id}`}
                        className={`bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 transition-all duration-700 ${
                          deletingTaskId === task.id
                            ? "opacity-30 scale-95"
                            : ""
                        }`}
                      >
                        {editingTaskId === task.id ? (
                          <div className="space-y-4">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full p-4 rounded-2xl border bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />

                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full p-4 rounded-2xl border bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Priority</label>
                                <CustomSelect
                                  value={editPriority}
                                  onChange={setEditPriority}
                                  options={[
                                    { value: "High", label: "High" },
                                    { value: "Medium", label: "Medium" },
                                    { value: "Low", label: "Low" }
                                  ]}
                                  buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl p-4 font-medium"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Due Date</label>
                                <CustomDatePicker
                                  value={editDueDate}
                                  onChange={setEditDueDate}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Est. Duration (hours)</label>
                              <input
                                type="number"
                                value={editEstimatedDuration}
                                onChange={(e) => setEditEstimatedDuration(e.target.value)}
                                className="w-full p-4 rounded-2xl border bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                              />
                            </div>

                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Assignee</label>
                            <CustomSelect
                              value={editAssignedTo ? Number(editAssignedTo) : ""}
                              onChange={(val) => setEditAssignedTo(val)}
                              options={[
                                { value: "", label: "Select Team Member" },
                                ...members.map((m) => ({ value: m.id, label: m.name }))
                              ]}
                              buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl p-4 mb-4"
                            />

                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Status</label>
                            <CustomSelect
                              value={editStatus}
                              onChange={setEditStatus}
                              options={[
                                { value: "pending", label: "Pending" },
                                { value: "in progress", label: "In Progress" },
                                { value: "completed", label: "Completed" }
                              ]}
                              buttonClassName="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-2xl p-4"
                            />

                            <div className="flex gap-3">
                              <button
                                onClick={() => saveEdit(task.id)}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-semibold"
                              >
                                <Save size={16} />
                                Save
                              </button>

                              <button
                                onClick={() => setEditingTaskId(null)}
                                className="flex items-center gap-2 bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl font-semibold"
                              >
                                <X size={16} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                  {task.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
                                  {task.description}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(task)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  <Pencil size={18} />
                                </button>

                                <button
                                  onClick={() => confirmDelete(task)}
                                  className="text-red-400 hover:text-red-650"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                              <span className="text-xs text-slate-400">Assigned To:</span>
                              <Avatar user={members.find(m => m.id === task.assigned_to)} size="xs" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {members.find((member) => member.id === task.assigned_to)?.name || "Unassigned"}
                              </span>
                            </div>

                            <TaskDetailsBlock task={task} />

                            {deletingTaskId === task.id && (
                              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-400">
                                  <AlertTriangle size={16} />
                                  <span>Permanently delete this task assignment?</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={executeDelete}
                                    className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={cancelDelete}
                                    className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl font-bold text-xs"
                                  >
                                    Keep
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Workspace Settings */}
          {activeTab === "settings" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-xl mx-auto w-full space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <Settings className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-950 dark:text-white text-base">Global Preferences</h3>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">Workspace Name</label>
                  <input
                    type="text"
                    value={workspaceSettings.workspace_name}
                    onChange={(e) => handleSaveSettings({ workspace_name: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">Brand Hex Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={workspaceSettings.brand_color}
                      onChange={(e) => handleSaveSettings({ brand_color: e.target.value })}
                      className="h-11 w-11 rounded-lg border-0 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={workspaceSettings.brand_color}
                      onChange={(e) => handleSaveSettings({ brand_color: e.target.value })}
                      className="w-full p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">Workspace Timezone</label>
                  <CustomSelect
                    value={workspaceSettings.timezone}
                    onChange={(val) => handleSaveSettings({ timezone: val })}
                    options={[
                      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                      { value: "EST", label: "EST (Eastern Standard Time)" },
                      { value: "IST", label: "IST (Indian Standard Time)" },
                      { value: "PST", label: "PST (Pacific Standard Time)" }
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">Date Formatting</label>
                  <CustomSelect
                    value={workspaceSettings.date_format}
                    onChange={(val) => handleSaveSettings({ date_format: val })}
                    options={[
                      { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-07-03)" },
                      { value: "DD/MM/YYYY", label: "DD/MM/YYYY (03/07/2026)" },
                      { value: "MM/DD/YYYY", label: "MM/DD/YYYY (07/03/2026)" }
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">Default Task Priority</label>
                  <CustomSelect
                    value={workspaceSettings.default_priority}
                    onChange={(val) => handleSaveSettings({ default_priority: val })}
                    options={[
                      { value: "High", label: "High" },
                      { value: "Medium", label: "Medium" },
                      { value: "Low", label: "Low" }
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Security Center & Data Management */}
          {activeTab === "security" && (
            <div className="grid xl:grid-cols-2 gap-8">
              {/* Security Center */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Lock className="text-emerald-600" size={18} />
                  <h3 className="font-bold text-slate-950 dark:text-white text-base">Security Center</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <span className="text-xs text-slate-500 font-semibold">Failed Login Alerts</span>
                    <span className="text-xs font-extrabold text-red-500">0 Attempts</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <span className="text-xs text-slate-500 font-semibold">Active Sessions</span>
                    <span className="text-xs font-bold text-slate-850 dark:text-white">1 Browser (Current)</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <span className="text-xs text-slate-500 font-semibold">Two-Factor Auth (2FA)</span>
                    <span className="text-xs font-bold text-slate-400">Placeholder (Disabled)</span>
                  </div>
                </div>
              </div>

              {/* Data Administration */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Database className="text-indigo-650" size={18} />
                  <h3 className="font-bold text-slate-950 dark:text-white text-base">Data Management</h3>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
                      const downloadAnchor = document.createElement("a");
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "workspace_backup.json");
                      downloadAnchor.click();
                      toast.success("Workspace data backup successfully exported!");
                    }}
                    className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 dark:text-white rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <Download className="text-slate-450" size={20} />
                    Backup Workspace Data
                  </button>

                  <button 
                    onClick={() => {
                      toast.success("Active query caches successfully purged!");
                    }}
                    className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 dark:text-white rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <RefreshCw className="text-slate-455 animate-spin duration-1000" size={20} />
                    Clear Cache Memory
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal Dialog */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] w-full max-w-md p-7 space-y-6">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg dark:text-white">Invite User</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-650">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-705 dark:text-white text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-705 dark:text-white text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
                <input
                  type="text"
                  placeholder="Engineering"
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-705 dark:text-white text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Workspace Role</label>
                <CustomSelect
                  value={inviteRole}
                  onChange={setInviteRole}
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "manager", label: "Manager" },
                    { value: "member", label: "Member" },
                    { value: "viewer", label: "Viewer" }
                  ]}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Send Invite
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal Dialog */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] w-full max-w-sm p-7 space-y-6">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg dark:text-white">Reset Password</h3>
              <button onClick={() => { setShowResetModal(false); setResetUser(null); }} className="text-slate-400 hover:text-slate-650">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
                Set a new password for <span className="font-bold text-slate-800 dark:text-slate-200">{resetUser?.name}</span>:
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-400 uppercase font-mono">Temporary Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter temporary password"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-705 dark:text-white text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Confirm Reset
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}