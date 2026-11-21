import { useState } from 'react';

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
};

function TaskForm({ task, onSubmit, onClose }) {
  const isEdit = Boolean(task);

  const [form, setForm] = useState(() => {
    if (!task) return EMPTY_FORM;
    return {
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    };
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <h2 className="modal__title">{isEdit ? 'Edit Task' : 'Create New Task'}</h2>
        <form className="task-form" onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label htmlFor="tf-title">Title *</label>
            <input
              id="tf-title"
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="Task title…"
            />
            {fieldErrors.title && <span className="form-error-text">{fieldErrors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="tf-desc">Description</label>
            <textarea
              id="tf-desc"
              value={form.description}
              onChange={set('description')}
              placeholder="Optional description…"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tf-status">Status</label>
              <select id="tf-status" value={form.status} onChange={set('status')}>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tf-priority">Priority</label>
              <select id="tf-priority" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tf-due">Due Date</label>
            <input
              id="tf-due"
              type="date"
              value={form.due_date}
              onChange={set('due_date')}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default TaskForm;
