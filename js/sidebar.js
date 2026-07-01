// Job list: search, PRJT STATUS filter chips, sorted grouped list.

import { PRJT_STATUS_ORDER, PRJT_COLOR_VARS } from './header.js';

const listEl = document.getElementById('job-list');
const searchEl = document.getElementById('job-search');
const chipsEl = document.getElementById('prjt-status-chips');

let allJobs = [];
let searchText = '';
let statusFilter = 'ALL';
let selectedJobId = null;
let onSelectJobCb = null;

function jobNumberParts(jobNumber) {
  const match = (jobNumber || '').match(/(\d+)\D+(\d+)/);
  if (match) return [Number(match[1]), Number(match[2])];
  return [0, 0];
}

function compareJobsDesc(a, b) {
  const [ay, an] = jobNumberParts(a.jobNumber);
  const [by, bn] = jobNumberParts(b.jobNumber);
  if (ay !== by) return by - ay;
  if (an !== bn) return bn - an;
  return (b.jobNumber || '').localeCompare(a.jobNumber || '');
}

function groupRank(status) {
  const idx = PRJT_STATUS_ORDER.indexOf(status);
  return idx === -1 ? PRJT_STATUS_ORDER.length : idx;
}

function getFilteredSortedJobs() {
  const q = searchText.trim().toLowerCase();
  let jobs = allJobs;

  if (statusFilter !== 'ALL') {
    jobs = jobs.filter((j) => j.prjtStatus === statusFilter);
  }
  if (q) {
    jobs = jobs.filter((j) => j.jobNameNo.toLowerCase().includes(q));
  }

  return [...jobs].sort((a, b) => {
    const rankDiff = groupRank(a.prjtStatus) - groupRank(b.prjtStatus);
    if (rankDiff !== 0) return rankDiff;
    return compareJobsDesc(a, b);
  });
}

function renderJobRow(job) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'job-row' + (job.id === selectedJobId ? ' is-selected' : '');

  const top = document.createElement('div');
  top.className = 'job-row-top';
  const number = document.createElement('span');
  number.className = 'job-row-number';
  number.textContent = job.jobNumber;
  const dot = document.createElement('span');
  dot.className = 'job-row-dot';
  const fgVar = (PRJT_COLOR_VARS[job.prjtStatus] || PRJT_COLOR_VARS.CLOSED)[1];
  dot.style.background = `var(${fgVar})`;
  top.append(number, dot);

  const name = document.createElement('div');
  name.className = 'job-row-name';
  name.textContent = job.jobName || job.jobNameNo;

  const prop = document.createElement('div');
  prop.className = 'job-row-prop';
  prop.textContent = job.propStatus || '';

  row.append(top, name, prop);
  row.addEventListener('click', () => {
    if (onSelectJobCb) onSelectJobCb(job);
  });
  return row;
}

function renderJobList() {
  listEl.innerHTML = '';
  const jobs = getFilteredSortedJobs();

  if (!jobs.length) {
    const msg = document.createElement('div');
    msg.className = 'sidebar-msg';
    msg.textContent = allJobs.length ? 'No jobs match your search.' : 'No jobs found.';
    listEl.appendChild(msg);
    return;
  }

  const frag = document.createDocumentFragment();
  jobs.forEach((job) => frag.appendChild(renderJobRow(job)));
  listEl.appendChild(frag);
}

export function initSidebar({ onSelectJob }) {
  onSelectJobCb = onSelectJob;

  let searchDebounce;
  searchEl.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchText = searchEl.value;
      renderJobList();
    }, 120);
  });

  chipsEl.addEventListener('click', (evt) => {
    const btn = evt.target.closest('.chip');
    if (!btn) return;
    statusFilter = btn.dataset.value;
    chipsEl.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-active', c === btn));
    renderJobList();
  });
}

export function setJobs(jobs) {
  allJobs = jobs;
  renderJobList();
}

export function setSelectedJobId(jobId) {
  selectedJobId = jobId;
  renderJobList();
}

export function setSidebarError(message, onRetry) {
  listEl.innerHTML = '';
  const msg = document.createElement('div');
  msg.className = 'sidebar-msg is-error';
  msg.textContent = message;
  if (onRetry) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn retry-btn';
    retry.textContent = 'Retry';
    retry.addEventListener('click', onRetry);
    msg.appendChild(retry);
  }
  listEl.appendChild(msg);
}
