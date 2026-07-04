import Avatar from "./Avatar";

function TeamTable({ members = [] }) {
  const displayMembers = members.length > 0
    ? members.map((m, index) => {
        const roles = [
          "Frontend Developer",
          "Backend Developer",
          "UI/UX Designer",
          "QA Engineer",
          "Fullstack Developer",
        ];
        const role = roles[index % roles.length];
        const statuses = ["Active", "Busy", "Active", "Offline"];
        const status = statuses[index % statuses.length];
        return {
          ...m,
          name: m.name,
          role: m.job_title || role,
          status: status,
        };
      })
    : [
        {
          name: "Aarav Sharma",
          role: "Frontend Developer",
          status: "Active",
        },
        {
          name: "Priya Mehta",
          role: "Backend Developer",
          status: "Busy",
        },
        {
          name: "Rohan Patel",
          role: "UI/UX Designer",
          status: "Active",
        },
        {
          name: "Neha Verma",
          role: "QA Engineer",
          status: "Offline",
        },
      ];

  const getStatusColor = (status) => {
    if (status === "Active") {
      return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
    }

    if (status === "Busy") {
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    }

    return "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-7">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Team Members
        </h3>

        <button className="text-indigo-500 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {displayMembers.map((member, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl p-4"
          >
            <div className="flex items-center gap-4">
              <Avatar user={member} size="md" />

              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {member.name}
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {member.role}
                </p>
              </div>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                member.status
              )}`}
            >
              {member.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamTable;