export default function Avatar({ user, size = "md", className = "" }) {
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getSizeClass = () => {
    switch (size) {
      case "xs":
        return "w-8 h-8 text-xs font-semibold";
      case "sm":
        return "w-10 h-10 text-sm font-semibold";
      case "lg":
        return "w-16 h-16 text-xl font-bold";
      case "xl":
        return "w-24 h-24 text-3xl font-bold";
      case "md":
      default:
        return "w-12 h-12 text-base font-bold";
    }
  };

  const initials = getInitials(user?.name);
  const sizeClass = getSizeClass();

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || "User profile"}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm shrink-0 select-none uppercase tracking-wider font-semibold ${sizeClass} ${className}`}
    >
      {initials}
    </div>
  );
}
