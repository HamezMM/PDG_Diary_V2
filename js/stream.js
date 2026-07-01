// Entry stream: Work Plan band, date-grouped entries, Project Notes block.

import { renderEntryCard, formatFullDate } from './render/entryCard.js';
import { renderTaskList } from './render/taskList.js';

const streamEl = document.getElementById('stream');
const chipsEl = document.getElementById('entry-type-chips');
const composeBtn = document.getElementById('compose-btn');

let entries = [];
let staffById = new Map();
let typeFilter = 'ALL';
let onToggleTaskCb = null;
let onRetryCb = null;

function groupByDate(list) {
  const map = new Map();
  list.forEach((entry) => {
    const key = entry.entryDate || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  });
  return map;
}

function render() {
  streamEl.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'stream-empty';
    empty.innerHTML = 'No entries yet. Add the first one.<br><span class="compose-hint">Use the + New Entry button to get started.</span>';
    streamEl.appendChild(empty);
    return;
  }

  const filtered = typeFilter === 'ALL' ? entries : entries.filter((e) => e.type === typeFilter);

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'stream-empty';
    empty.textContent = 'No entries match this filter.';
    streamEl.appendChild(empty);
    return;
  }

  const workPlanEntries = filtered.filter((e) => e.type === 'Work Plan');
  const projectNotes = filtered.filter((e) => e.type === 'Project Note');
  const dated = filtered.filter((e) => e.type !== 'Work Plan' && e.type !== 'Project Note');

  if (workPlanEntries.length) {
    const band = document.createElement('div');
    band.className = 'workplan-band';

    const header = document.createElement('div');
    header.className = 'workplan-band-header';
    header.textContent = 'Work Plan';
    band.appendChild(header);

    workPlanEntries.forEach((entry) => {
      const wrap = document.createElement('div');
      wrap.className = 'workplan-entry';
      wrap.appendChild(renderEntryCard(entry, { staffById }));
      wrap.appendChild(renderTaskList(entry.tasks || [], { staffById, onToggle: onToggleTaskCb }));
      band.appendChild(wrap);
    });

    streamEl.appendChild(band);
  }

  const dateGroups = groupByDate(dated);
  dateGroups.forEach((groupEntries, dateKey) => {
    const group = document.createElement('div');
    group.className = 'date-group';

    const heading = document.createElement('div');
    heading.className = 'date-group-heading';
    heading.textContent = formatFullDate(dateKey);
    group.appendChild(heading);

    groupEntries.forEach((entry) => group.appendChild(renderEntryCard(entry, { staffById })));
    streamEl.appendChild(group);
  });

  if (projectNotes.length) {
    const section = document.createElement('div');
    section.className = 'project-notes-section';

    const heading = document.createElement('div');
    heading.className = 'project-notes-heading';
    heading.textContent = 'Project Notes';
    section.appendChild(heading);

    projectNotes.forEach((entry) => section.appendChild(renderEntryCard(entry, { staffById })));
    streamEl.appendChild(section);
  }
}

export function initStream({ onToggleTask }) {
  onToggleTaskCb = onToggleTask;

  chipsEl.addEventListener('click', (evt) => {
    const btn = evt.target.closest('.chip');
    if (!btn) return;
    typeFilter = btn.dataset.value;
    chipsEl.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === btn));
    render();
  });
}

export function setStaffMap(map) {
  staffById = map;
}

export function setEntries(list) {
  entries = list;
  chipsEl.hidden = false;
  composeBtn.hidden = false;
  render();
}

export function clearStream() {
  entries = [];
  chipsEl.hidden = true;
  composeBtn.hidden = true;
  streamEl.innerHTML = '<div class="stream-empty">Select a project from the sidebar to view its diary.</div>';
}

export function setStreamLoading() {
  chipsEl.hidden = true;
  composeBtn.hidden = true;
  streamEl.innerHTML = '<div class="stream-empty">Loading entries…</div>';
}

export function setStreamError(message, onRetry) {
  onRetryCb = onRetry;
  chipsEl.hidden = true;
  composeBtn.hidden = true;
  streamEl.innerHTML = '';
  const err = document.createElement('div');
  err.className = 'stream-error';
  err.textContent = message;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'btn';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => onRetryCb && onRetryCb());
  err.appendChild(document.createElement('br'));
  err.appendChild(retry);
  streamEl.appendChild(err);
}

export function getTaskById(taskId) {
  for (const entry of entries) {
    const task = (entry.tasks || []).find((t) => t.id === taskId);
    if (task) return task;
  }
  return null;
}

// Mutates the matching task in place (used for optimistic updates and
// reverts) and re-renders the stream.
export function patchTask(taskId, patch) {
  const task = getTaskById(taskId);
  if (!task) return null;
  Object.assign(task, patch);
  render();
  return task;
}
