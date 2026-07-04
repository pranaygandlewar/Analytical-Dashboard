import { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import Avatar from "../components/Avatar";
import { 
  User, 
  Shield, 
  Bell, 
  Moon, 
  Save, 
  Camera, 
  Trash2, 
  Upload, 
  Key, 
  Eye, 
  EyeOff, 
  Award, 
  Activity, 
  Briefcase, 
  Phone, 
  MapPin, 
  FileText,
  Calendar,
  CheckCircle2,
  Clock
} from "lucide-react";

function Settings({ darkMode, setDarkMode }) {
  const authUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile Info States
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    job_title: "",
    department: "",
    phone: "",
    location: "",
    bio: "",
    avatar: ""
  });
  
  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // UI States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  
  // Analytics States
  const [tasks, setTasks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (authUser) {
      setProfile({
        name: authUser.name || "",
        email: authUser.email || "",
        job_title: authUser.job_title || "",
        department: authUser.department || "",
        phone: authUser.phone || "",
        location: authUser.location || "",
        bio: authUser.bio || "",
        avatar: authUser.avatar || ""
      });
    }
  }, [authUser]);

  useEffect(() => {
    // Fetch user tasks for productivity stats
    api.get("/tasks")
      .then((res) => {
        setTasks(res.data);
      })
      .catch(console.log);

    // Fetch user notifications to show as activity logs
    api.get("/notifications")
      .then((res) => {
        setTimeline(res.data.slice(0, 15)); // Get top 15 logs
      })
      .catch(console.log);
  }, []);

  // Calculate fields completed
  const calculateCompletion = () => {
    let completed = 0;
    let total = 8;
    if (profile.avatar) completed++;
    if (profile.name) completed++;
    if (profile.email) completed++;
    if (profile.job_title) completed++;
    if (profile.department) completed++;
    if (profile.phone) completed++;
    if (profile.location) completed++;
    if (profile.bio) completed++;
    return Math.round((completed / total) * 100);
  };

  // Password strength checker
  const getPasswordStrength = () => {
    if (!newPassword) return { text: "None", color: "bg-slate-200 dark:bg-slate-700", width: "0%" };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { text: "Weak", color: "bg-red-500", width: "33%" };
    if (score <= 4) return { text: "Medium", color: "bg-amber-500", width: "66%" };
    return { text: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength();

  // Drag and Drop Avatar handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP image formats are supported.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfile((prev) => ({ ...prev, avatar: e.target.result }));
      toast.success("Avatar preview loaded!");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeAvatar = () => {
    setProfile((prev) => ({ ...prev, avatar: "" }));
    toast.success("Avatar removed from queue");
  };

  // Save Settings actions
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await api.put("/users/me/profile", profile);
      useAuthStore.setState({ user: res.data.user });
      toast.success("Profile saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New and confirm passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await api.put("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // Stats Calculations
  const userTasks = tasks.filter((t) => t.assigned_to === authUser?.id);
  const currentAssignedTasks = userTasks.filter((t) => t.status !== "completed").length;
  const completedTasks = userTasks.filter((t) => t.status === "completed").length;
  const totalUserTasksCount = userTasks.length;
  const productivityScore = totalUserTasksCount > 0 
    ? Math.round((completedTasks / totalUserTasksCount) * 100)
    : 100;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const completionPct = calculateCompletion();

  return (
    <AppLayout>
      <div className="mt-8 mb-6">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your workspace account preferences</p>
      </div>

      {/* Profile Completion Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white">Profile Completion</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Complete your metadata fields to unlock productivity milestones</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-64">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
            <div 
              className="bg-indigo-650 h-full rounded-full transition-all duration-500" 
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="font-bold text-slate-800 dark:text-white text-sm whitespace-nowrap">{completionPct}%</span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-850 p-2 rounded-2xl">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === "profile" 
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <User size={16} />
          Profile Details
        </button>

        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === "account" 
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Award size={16} />
          Account Stats
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === "security" 
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Shield size={16} />
          Security Settings
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === "activity" 
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm" 
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Activity size={16} />
          Activity Log
        </button>
      </div>

      {/* Tab Contents */}
      <div className="grid gap-8">
        {activeTab === "profile" && (
          <div className="grid xl:grid-cols-3 gap-8">
            {/* Left side: Avatar Management */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-7 flex flex-col items-center justify-between text-center min-h-[380px]">
              <div className="w-full flex flex-col items-center">
                <h3 className="font-bold text-slate-950 dark:text-white mb-6">Profile Photo</h3>
                
                <div className="relative mb-5 group">
                  <Avatar user={{ avatar: profile.avatar, name: profile.name }} size="xl" className="shadow-lg border-4 border-slate-100 dark:border-slate-800" />
                  {profile.avatar && (
                    <button 
                      onClick={removeAvatar}
                      className="absolute -bottom-1.5 -right-1.5 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow-md"
                      title="Remove avatar"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-5 cursor-pointer transition ${
                    dragActive 
                      ? "border-indigo-600 bg-indigo-50/10" 
                      : "border-slate-200 dark:border-slate-700 hover:border-indigo-500"
                  }`}
                >
                  <Upload className="mx-auto text-slate-400 mb-2.5" size={24} />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Drag & Drop Image</p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, or WEBP (Max 2MB)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileInput} 
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Preferences embedded inside Profile Tab */}
              <div className="w-full border-t border-slate-100 dark:border-slate-800 mt-6 pt-6 text-left space-y-4">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Preferences</h4>
                
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Moon className="text-indigo-600" size={16} />
                    <div>
                      <h4 className="text-xs font-bold dark:text-white">Dark Interface</h4>
                      <p className="text-[10px] text-slate-400">Glassmorphic dark design</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      document.documentElement.classList.add("notransition");
                      const newTheme = !darkMode;
                      setDarkMode(newTheme);
                      localStorage.setItem("theme", newTheme ? "dark" : "light");
                      if (newTheme) {
                        document.documentElement.classList.add("dark");
                      } else {
                        document.documentElement.classList.remove("dark");
                      }
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          document.documentElement.classList.remove("notransition");
                        });
                      });
                      toast.success(newTheme ? "Dark mode enabled" : "Dark mode disabled");
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      darkMode 
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {darkMode ? "Dark" : "Light"}
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="text-indigo-600" size={16} />
                    <div>
                      <h4 className="text-xs font-bold dark:text-white">Activity Notifications</h4>
                      <p className="text-[10px] text-slate-400">Realtime activity alerts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNotifications(!notifications);
                      toast.success(notifications ? "Notifications disabled" : "Notifications enabled");
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      notifications 
                        ? "bg-indigo-600 border-indigo-600 text-white" 
                        : "bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {notifications ? "Active" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Detailed form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 xl:col-span-2 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <FileText className="text-indigo-600" size={20} />
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Profile Information</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Job Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Frontend Developer"
                      value={profile.job_title}
                      onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. +1 555-0199"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450 dark:text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. New York, USA"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">Bio / About Me</label>
                <textarea
                  placeholder="Share details about your roles, accomplishments or skills..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium text-sm outline-none resize-none"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition"
              >
                <Save size={18} />
                {savingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div className="grid xl:grid-cols-2 gap-8">
            {/* Account Information Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                Account Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Workspace Role</span>
                  <span className="text-sm font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                    {authUser?.role}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <Calendar size={16} className="text-slate-400" />
                    Account Created
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(authUser?.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <Clock size={16} className="text-slate-400" />
                    Last Login Timestamp
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(authUser?.last_login)}
                  </span>
                </div>
              </div>
            </div>

            {/* Productivity statistics */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                Productivity Metrics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 text-center">
                  <CheckCircle2 className="mx-auto text-emerald-600 mb-2" size={24} />
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Tasks Completed</p>
                  <p className="text-2xl font-extrabold text-slate-850 dark:text-white mt-1.5">{completedTasks}</p>
                </div>

                <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 text-center">
                  <Clock className="mx-auto text-amber-600 mb-2" size={24} />
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Pending Tasks</p>
                  <p className="text-2xl font-extrabold text-slate-850 dark:text-white mt-1.5">{currentAssignedTasks}</p>
                </div>

                <div className="col-span-2 p-5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Productivity Score</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Ratio of completed tasks over assigned</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-extrabold text-indigo-650 dark:text-indigo-400">{productivityScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <Key className="text-emerald-600" size={20} />
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Credentials & Security</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3.5 pr-11 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3.5 pr-11 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={
                        strength.text === "Strong" 
                          ? "text-emerald-500" 
                          : strength.text === "Medium" 
                          ? "text-amber-500" 
                          : "text-red-500"
                      }>
                        {strength.text}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`} 
                        style={{ width: strength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-450 dark:text-slate-500 uppercase font-bold">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3.5 pr-11 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSavePassword}
                disabled={savingPassword}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-indigo-600/10 transition"
              >
                {savingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 max-w-2xl mx-auto w-full space-y-6">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
              Profile Activity Timeline
            </h3>

            {timeline.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 py-10 font-semibold">
                No recent activity logs found.
              </p>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800/80 space-y-6">
                {timeline.map((item, idx) => {
                  let categoryColor = "bg-slate-500";
                  if (item.category === "Task Assigned") categoryColor = "bg-indigo-500";
                  else if (item.category === "Task Completed") categoryColor = "bg-emerald-500";
                  else if (item.category === "System Alert") categoryColor = "bg-red-500";
                  else if (item.category === "Team Activity") categoryColor = "bg-sky-500";
                  else if (item.category === "Task Updated") categoryColor = "bg-amber-500";

                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Circle Dot */}
                      <span className={`absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border-4 border-white dark:border-slate-900 ${categoryColor}`} />
                      
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider scale-90 origin-left" style={{ backgroundColor: categoryColor.replace("bg-", "var(--color-") || "#6366f1" }}>
                            {item.category || "Log"}
                          </span>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mt-1.5">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Settings;
