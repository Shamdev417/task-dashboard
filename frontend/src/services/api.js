// Base URL — dev mein Vite proxy use hota hai, production mein VITE_API_URL
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/tasks`
  : '/api/tasks';

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.errors) {
        message = data.errors.map((e) => e.msg).join(', ');
      } else if (data.error) {
        message = data.error;
      }
    } catch (_) {}
    throw new Error(message);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export async function fetchTasks(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  const res = await fetch(`${BASE}${qs ? '?' + qs : ''}`);
  return handleResponse(res);
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/stats`);
  return handleResponse(res);
}

export async function createTask(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateTask(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}
