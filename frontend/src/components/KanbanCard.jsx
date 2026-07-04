function KanbanCard({ task }) {
  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl border border-slate-800">
      <h3 className="font-semibold text-lg">{task.title}</h3>

      <div className="mt-4 flex justify-between text-sm text-slate-400">
        <span>{task.assignee}</span>
        <span>{task.due}</span>
      </div>

      <div className="mt-4">
        <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs">
          {task.priority}
        </span>
      </div>
    </div>
  );
}

export default KanbanCard;