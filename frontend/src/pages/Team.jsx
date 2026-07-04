import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import { Search, Plus, Trash2, X, Users, AlertTriangle } from "lucide-react";
import { SkeletonTaskCard } from "../components/SkeletonLoader";
import Avatar from "../components/Avatar";

function TeamCard({ member, onDelete }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-7 hover:shadow-xl transition">
      <div className="flex items-center gap-4">
        <Avatar user={member} size="lg" />

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{member.name}</h3>

          <p className="text-slate-500 dark:text-slate-400 capitalize">{member.role}</p>
        </div>
      </div>

      <p className="text-slate-500 dark:text-slate-400 mt-5">{member.email}</p>

      <div className="mt-6 flex justify-between items-center">
        <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-sm font-semibold">
          Active
        </span>

        <button
          onClick={() => onDelete(member)}
          className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-2xl transition"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function TeamSkeleton() {
  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-5 mt-8">
        <div className="h-6 w-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonTaskCard key={i} />
        ))}
      </div>
    </>
  );
}

export default function Team() {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });

  const fetchMembers = () => {
    api
      .get("/users")
      .then((res) => {
        const onlyMembers = res.data.filter((user) => user.role === "member");

        setMembers(onlyMembers);
      })
      .catch(console.log)
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      });
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const confirmDelete = () => {
    api.delete(`/users/${memberToDelete.id}`).then(() => {
      setMembers((prev) =>
        prev.filter((member) => member.id !== memberToDelete.id),
      );

      setMemberToDelete(null);
      toast.success("Member removed");
    });
  };

  const addMember = () => {
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error("Please fill all fields");
      return;
    }

    api
      .post("/signup", newMember)
      .then(() => {
        fetchMembers();

        setNewMember({
          name: "",
          email: "",
          password: "",
          role: "member",
        });

        setShowModal(false);

        toast.success("Member added successfully");
      })
      .catch(() => {
        toast.error("Failed to add member");
      });
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <AppLayout>
        <div className="mt-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Team Management
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Manage team members and access
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-4 rounded-3xl flex items-center gap-3 font-semibold shadow-lg transition"
          >
            <Plus size={20} />
            Add Member
          </button>
        </div>

        {loading ? (
          <TeamSkeleton />
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm p-5 mt-8 flex items-center gap-4">
              <Search className="text-slate-400" />

              <input
                type="text"
                placeholder="Search team members..."
                className="w-full outline-none text-slate-700 dark:text-white bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredMembers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-12 text-center mt-8">
                <Users size={50} className="mx-auto text-slate-300 dark:text-slate-600" />

                <h2 className="text-2xl font-bold mt-5 dark:text-white">No Members Found</h2>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
                {filteredMembers.map((member) => (
                  <TeamCard
                    key={member.id}
                    member={member}
                    onDelete={setMemberToDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </AppLayout>

      {/* Add Member Modal */}
      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-[520px] shadow-2xl border dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold dark:text-white">Add Team Member</h2>

              <button onClick={() => setShowModal(false)} className="dark:text-white">
                <X />
              </button>
            </div>

            <div className="space-y-5">
              <input
                placeholder="Full Name"
                className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    name: e.target.value,
                  })
                }
              />

              <input
                placeholder="Email"
                className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    email: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                value={newMember.password}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    password: e.target.value,
                  })
                }
              />

              <button
                onClick={addMember}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-semibold transition"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-[480px] shadow-2xl border dark:border-slate-800 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-500" />
            </div>

            <h2 className="text-2xl font-bold mt-6 dark:text-white">Remove Team Member?</h2>

            <p className="text-slate-500 dark:text-slate-400 mt-3">This action cannot be undone.</p>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 py-4 rounded-2xl font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
