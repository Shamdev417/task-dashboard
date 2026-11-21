import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { fetchTasks, fetchStats, createTask, updateTask, deleteTask } from './services/api.js';
import Dashboard from './components/Dashboard.jsx';
import TaskList from './components/TaskList.jsx';
import TaskForm from './components/TaskForm.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import FilterBar from './components/FilterBar.jsx';

function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', search: '' });

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [taskData, statsData] = await Promise.all([fetchTasks(), fetchStats()]);
      setTasks(taskData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering
  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !task.title.toLowerCase().includes(q) &&
        !(task.description || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await createTask(formData);
      }
      setShowForm(false);
      setEditingTask(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
      await loadData();
    } catch (err) {
      setError(err.message);
      setTaskToDelete(null);
    }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Task <span>Dashboard</span></h1>
        <button className="btn-new-task" onClick={openCreate}>
          + New Task
        </button>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <Dashboard stats={stats} />

        <FilterBar filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="spinner-overlay">
            <div className="spinner" />
          </div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            onEdit={openEdit}
            onDelete={setTaskToDelete}
          />
        )}
      </main>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={handleCreateOrUpdate}
          onClose={closeForm}
        />
      )}

      {taskToDelete && (
        <ConfirmDialog
          task={taskToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setTaskToDelete(null)}
        />
      )}
    </div>
  );
}

export default App;
