import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import { FolderKanban, Plus, X, MessageSquare } from "lucide-react";
import { useDraggable, useDroppable, DndContext, closestCenter } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import TaskDetailsBlock from "../components/TaskDetailsBlock";
import CustomSelect from "../components/CustomSelect";
import CustomDatePicker from "../components/CustomDatePicker";
import {
  SkeletonTaskCard,
} from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";
import TaskCollaborationDrawer from "../components/TaskCollaborationDrawer";

function BoardSkeleton() {
  return (
    <div className="grid xl:grid-cols-3 gap-8 mt-8">
      {Array.from({ length: 3 }).map((_, col) => (
        <div
          key={col}
          className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 min-h-[700px]"
        >
          <div className="h-8 w-40 bg-slate-300 dark:bg-slate-700 rounded-xl animate-pulse mb-8" />

          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonTaskCard key={i} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TaskCard({ task, members, onOpenDetails }) {
  const member = members.find(
    (m) => m.id === task.assigned_to
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: task.id.toString(),
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 mb-4 shadow-sm hover:shadow-xl transition cursor-grab"
    >
      <h3 className="font-bold text-slate-900 dark:text-white text-lg">
        {task.title}
      </h3>

      <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm">
        {task.description}
      </p>

      <TaskDetailsBlock task={task} />

      <div className="mt-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {member?.name || "Unknown"}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onOpenDetails(task);
            }}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-650 transition"
            title="Task discussions"
          >
            <MessageSquare size={13} />
          </button>
        </div>

        <span className="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold">
          {task.status}
        </span>
      </div>
    </div>
  );
}

function Column({
  id,
  title,
  tasks,
  members,
  onOpenDetails,
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 min-h-[700px]"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>

        <span className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-sm font-semibold dark:text-slate-300">
          {tasks.length}
        </span>
      </div>

      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          members={members}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </div>
  );
}

function Projects() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "Medium",
    due_date: "",
    estimated_duration: "",
  });

  const fetchData = () => {
    Promise.all([
      api.get("/tasks"),
      api.get("/users"),
    ])
      .then(([tasksRes, usersRes]) => {
        setTasks(tasksRes.data);

        setMembers(
          usersRes.data.filter(
            (u) => u.role === "member"
          )
        );
      })
      .catch(console.log)
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedTasks = {
    todo: tasks.filter(
      (t) => t.status === "pending"
    ),
    progress: tasks.filter(
      (t) => t.status === "in progress"
    ),
    done: tasks.filter(
      (t) => t.status === "completed"
    ),
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const draggedTask = tasks.find(
      (t) =>
        t.id.toString() === active.id
    );

    if (!draggedTask) return;

    let newStatus = draggedTask.status;

    if (over.id === "todo")
      newStatus = "pending";

    if (over.id === "progress")
      newStatus = "in progress";

    if (over.id === "done")
      newStatus = "completed";

    if (newStatus === draggedTask.status)
      return;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === draggedTask.id
          ? { ...task, status: newStatus }
          : task
      )
    );

    api.put(`/tasks/${draggedTask.id}`, {
      title: draggedTask.title,
      description: draggedTask.description,
      assigned_to: draggedTask.assigned_to,
      priority: draggedTask.priority,
      due_date: draggedTask.due_date,
      estimated_duration: draggedTask.estimated_duration,
      status: newStatus,
    });

    toast.success("Task updated");
  };

  const addTask = () => {
    if (
      !newTask.title ||
      !newTask.description ||
      !newTask.assigned_to
    ) {
      toast.error("Please fill all fields");
      return;
    }

    api
      .post("/tasks", {
        title: newTask.title,
        description: newTask.description,
        assigned_to: Number(newTask.assigned_to),
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        estimated_duration: newTask.estimated_duration ? Number(newTask.estimated_duration) : null,
      })
      .then(() => {
        fetchData();

        setShowModal(false);

        setNewTask({
          title: "",
          description: "",
          assigned_to: "",
          priority: "Medium",
          due_date: "",
          estimated_duration: "",
        });

        toast.success("Task added");
      });
  };

  return (
    <>
      <AppLayout>
        <div className="mt-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              Project Board
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Drag and manage tasks
            </p>
          </div>

          <button
            onClick={() =>
              setShowModal(true)
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-4 rounded-3xl flex items-center gap-3 font-semibold"
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>

        {loading ? (
          <BoardSkeleton />
        ) : tasks.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              type="projects"
              title="No Workspace Projects Setup"
              description="Get started by creating your first task on the collaborative kanban board!"
              actionText="Create First Task"
              onAction={() => setShowModal(true)}
            />
          </div>
        ) : (
          <DndContext
            collisionDetection={
              closestCenter
            }
            onDragEnd={handleDragEnd}
          >
            <div className="grid xl:grid-cols-3 gap-8 mt-8">
              <Column
                id="todo"
                title="To Do"
                tasks={groupedTasks.todo}
                members={members}
                onOpenDetails={setSelectedTask}
              />

              <Column
                id="progress"
                title="In Progress"
                tasks={groupedTasks.progress}
                members={members}
                onOpenDetails={setSelectedTask}
              />

              <Column
                id="done"
                title="Done"
                tasks={groupedTasks.done}
                members={members}
                onOpenDetails={setSelectedTask}
              />
            </div>
          </DndContext>
        )}
      </AppLayout>

      {selectedTask && (
        <TaskCollaborationDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchData}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-[550px] shadow-2xl border dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <FolderKanban className="text-indigo-600" />
                <h2 className="text-2xl font-bold dark:text-white">
                  Add New Task
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="dark:text-white"
              >
                <X />
              </button>
            </div>

            <div className="space-y-5">
              <input
                placeholder="Task Title"
                className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    title: e.target.value,
                  })
                }
              />

              <textarea
                placeholder="Task Description"
                className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white h-32"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    description:
                      e.target.value,
                  })
                }
              />

              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Assignee</label>
              <CustomSelect
                value={newTask.assigned_to ? Number(newTask.assigned_to) : ""}
                onChange={(val) => setNewTask({ ...newTask, assigned_to: val })}
                options={[
                  { value: "", label: "Select Team Member" },
                  ...members.map((m) => ({ value: m.id, label: m.name }))
                ]}
                buttonClassName="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl p-4"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Priority</label>
                  <CustomSelect
                    value={newTask.priority}
                    onChange={(val) => setNewTask({ ...newTask, priority: val })}
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
                    value={newTask.due_date}
                    onChange={(val) =>
                      setNewTask({
                        ...newTask,
                        due_date: val,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">Est. Duration (hours - optional)</label>
                <input
                  type="number"
                  placeholder="Estimated hours"
                  className="w-full p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={newTask.estimated_duration}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      estimated_duration: e.target.value,
                    })
                  }
                />
              </div>

              <button
                onClick={addTask}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-semibold"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Projects;