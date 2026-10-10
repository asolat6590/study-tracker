export async function request(path, options = {}) {
  const { body, headers, ...rest } = options;
  let response;

  try {
    response = await fetch(`/api${path}`, {
      ...rest,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Сервер недоступен. В папке backend выполните npm run dev.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось выполнить запрос. Проверьте, что backend запущен на порту 3001.');
  }

  return data;
}

function statsQuery() {
  const offsetMinutes = -new Date().getTimezoneOffset();
  return `/stats?offsetMinutes=${offsetMinutes}`;
}

export const api = {
  getSubjects: () => request('/subjects'),
  createSubject: (body) => request('/subjects', { method: 'POST', body }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),
  getTasks: () => request('/tasks'),
  createTask: (body) => request('/tasks', { method: 'POST', body }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}`, { method: 'PATCH', body: { status } }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  getSessions: () => request('/sessions'),
  createSession: (body) => request('/sessions', { method: 'POST', body }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  getStats: () => request(statsQuery()),
};
