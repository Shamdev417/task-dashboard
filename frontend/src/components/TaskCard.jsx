function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (_) {
    return dateStr;
  }
}

function TaskCard({ task, onEdit, onDelete }) {
  const statusClass = `badge badge--${task.status}`;
  const priorityClass = `badge badge--${task.priority}`;

  return (
    <div className="task-card">
      <div className="task-card__header">
        <h3 className="task-card__title">{task.title}</h3>
      </div>

      {task.description && (
        <p className="task-card__desc">{task.description}</p>
      )}

      <div className="task-card__meta">
        <span className={statusClass}>{task.status}</span>
        <span className={priorityClass}>{task.priority}</span>
      </div>

      {task.due_date && (
        <span className="task-card__due">📅 Due: {formatDate(task.due_date)}</span>
      )}

      <div className="task-card__actions">
        <button className="btn-edit" onClick={onEdit}>✏ Edit</button>
        <button className="btn-delete" onClick={onDelete}>🗑 Delete</button>
      </div>
    </div>
  );
}

export default TaskCard;
