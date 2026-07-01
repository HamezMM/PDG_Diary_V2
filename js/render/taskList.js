// Work Plan task list (read view) — rendered inside the Work Plan band.

function formatShortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sortTasks(tasks) {
  const open = tasks.filter((t) => t.complete !== 'Done');
  const done = tasks.filter((t) => t.complete === 'Done');
  open.sort((a, b) => (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99'));
  done.sort((a, b) => (b.dateDone || '').localeCompare(a.dateDone || ''));
  return [...open, ...done];
}

function renderTaskRow(task, { staffById, onToggle }) {
  const row = document.createElement('div');
  row.className = 'task-row' + (task.complete === 'Done' ? ' is-done' : '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.complete === 'Done';
  checkbox.addEventListener('change', () => onToggle(task, checkbox.checked));
  row.appendChild(checkbox);

  const due = document.createElement('span');
  due.className = 'task-due';
  due.textContent = task.dueDate ? formatShortDate(task.dueDate) : '';
  row.appendChild(due);

  const name = document.createElement('span');
  name.className = 'task-name';
  name.textContent = task.task;
  row.appendChild(name);

  const assignee = staffById.get(task.assignedToId);
  if (assignee) {
    const who = document.createElement('span');
    who.className = 'task-assignee';
    who.textContent = assignee.firstName || assignee.fullName;
    row.appendChild(who);
  }

  return row;
}

export function renderTaskList(tasks, { staffById, onToggle }) {
  const wrap = document.createElement('div');
  wrap.className = 'task-list';
  sortTasks(tasks).forEach((task) => {
    wrap.appendChild(renderTaskRow(task, { staffById, onToggle }));
  });
  return wrap;
}
