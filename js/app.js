// Bootstrap, routing, state. Wires every other module together.

import { getJobs, getStaff, getEntries, updateTask } from './api.js';
import { getAuthor, setAuthor, clearAuthor, showStaffPicker } from './auth.js';
import { initSidebar, setJobs, setSelectedJobId, setSidebarError } from './sidebar.js';
import { renderProjectHeader } from './header.js';
import {
  initStream,
  setStaffMap,
  setEntries,
  clearStream,
  setStreamLoading,
  setStreamError,
  patchTask,
} from './stream.js';
import { initCompose, openCompose } from './compose.js';

export const state = {
  staff: [],
  staffById: new Map(),
  jobs: [],
  currentJob: null,
  author: null,
};

const connectionDot = document.getElementById('connection-status');
const topbarUser = document.getElementById('topbar-user');
const topbarUserName = document.getElementById('topbar-user-name');
const topbarSwitch = document.getElementById('topbar-switch');
const composeBtn = document.getElementById('compose-btn');
const toastStack = document.getElementById('toast-stack');

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function setConnectionStatus(status) {
  connectionDot.dataset.state = status;
  connectionDot.title = status === 'live' ? 'Connected' : status === 'error' ? 'Connection error' : 'Connecting…';
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  toastStack.appendChild(node);
  setTimeout(() => node.remove(), 4000);
}

function renderTopbarUser() {
  topbarUserName.textContent = state.author.fullName;
  topbarUser.hidden = false;
}

async function handleSelectJob(job) {
  state.currentJob = job;
  setSelectedJobId(job.id);
  renderProjectHeader(document.getElementById('project-header'), job);
  setStreamLoading();

  try {
    const entries = await getEntries(job.id);
    setEntries(entries);
  } catch (err) {
    setStreamError('Could not load entries for this project.', () => handleSelectJob(job));
  }
}

async function handleToggleTask(task, isChecked) {
  // Snapshot only the fields this action touches — reverting the whole task
  // would clobber any other field (dueDate, assignedTo, ...) that changed
  // out from under it between the optimistic patch and a failed PATCH.
  const originalPatch = { complete: task.complete, dateDone: task.dateDone, completedById: task.completedById };
  const patch = isChecked
    ? { complete: 'Done', dateDone: todayISO(), completedById: state.author.recordId }
    : { complete: 'Open', dateDone: null, completedById: null };

  patchTask(task.id, patch);

  try {
    const updated = await updateTask({
      recordId: task.id,
      complete: patch.complete,
      dateDone: patch.dateDone,
      completedBy: patch.completedById,
    });
    patchTask(task.id, updated);
  } catch {
    patchTask(task.id, originalPatch);
    toast('Task update failed.');
  }
}

async function refreshCurrentJobEntries() {
  if (!state.currentJob) return;
  try {
    const entries = await getEntries(state.currentJob.id);
    setEntries(entries);
  } catch {
    setStreamError('Could not load entries for this project.', () => handleSelectJob(state.currentJob));
  }
}

function handleComposeSubmit(result) {
  if (result.success) {
    refreshCurrentJobEntries();
  }
  if (result.partialTaskFailure) {
    toast('Entry saved, but tasks could not be saved.');
  }
}

function proceedWithAuthor(author) {
  state.author = author;
  renderTopbarUser();
}

// Fetches jobs and renders the sidebar. Returns whether it succeeded so the
// caller can fold the result into the single, centrally-decided connection
// status instead of each loader flipping the dot independently (which would
// race when staff and jobs load concurrently at boot).
async function loadJobs() {
  try {
    const jobs = await getJobs();
    state.jobs = jobs;
    setJobs(jobs);
    return true;
  } catch {
    setSidebarError('Could not load jobs. Refresh to try again.', retryLoadJobs);
    return false;
  }
}

async function retryLoadJobs() {
  const ok = await loadJobs();
  setConnectionStatus(ok ? 'live' : 'error');
}

async function loadStaff() {
  const staff = await getStaff();
  state.staff = staff;
  state.staffById = new Map(staff.map((s) => [s.id, s]));
  setStaffMap(state.staffById);
}

async function init() {
  setConnectionStatus('loading');
  clearStream();

  initSidebar({ onSelectJob: handleSelectJob });
  initStream({ onToggleTask: handleToggleTask });
  initCompose({ onSubmit: handleComposeSubmit });

  composeBtn.addEventListener('click', () => {
    if (!state.currentJob) return;
    openCompose({ job: state.currentJob, author: state.author, staffList: state.staff });
  });

  topbarSwitch.addEventListener('click', () => {
    clearAuthor();
    window.location.reload();
  });

  // Staff and jobs come from independent Airtable tables — load them
  // concurrently instead of gating the jobs fetch behind staff/author
  // resolution.
  const [staffOk, jobsOk] = await Promise.all([
    loadStaff().then(() => true).catch(() => false),
    loadJobs(),
  ]);

  if (!staffOk) {
    setConnectionStatus('error');
    setSidebarError('Could not load staff. Refresh to try again.', init);
    return;
  }

  setConnectionStatus(jobsOk ? 'live' : 'error');

  const existingAuthor = getAuthor();
  if (existingAuthor) {
    proceedWithAuthor(existingAuthor);
  } else {
    showStaffPicker(state.staff, (chosen) => {
      const author = setAuthor(chosen);
      proceedWithAuthor(author);
    });
  }
}

init();
