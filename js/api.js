// All fetch calls to /api/* routes. Every function throws an Error with a
// human-readable message on failure so callers can surface it directly.

async function request(path, options) {
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status}).`);
  }
  return data;
}

export function getJobs() {
  return request('/api/jobs');
}

export function getStaff() {
  return request('/api/staff');
}

export function getEntries(jobId) {
  return request(`/api/entries?jobId=${encodeURIComponent(jobId)}`);
}

export function createEntry(payload) {
  return request('/api/entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function createTasks(tasks) {
  return request('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tasks),
  });
}

export function updateTask(payload) {
  return request('/api/tasks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
