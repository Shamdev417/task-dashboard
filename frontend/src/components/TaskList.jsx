import TaskCard from './TaskCard.jsx';

function TaskList({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="task-list">
        <p className="task-list__empty">No tasks found. Create one with "+ New Task"!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task)}
        />
      ))}
    </div>
  );
}

export default TaskList;
