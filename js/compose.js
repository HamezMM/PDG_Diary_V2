// New entry compose modal: type-conditional fields + Work Plan task rows.

import { createEntry, createTasks } from './api.js';

const CATEGORY_CHOICES = [
  'Code/Bylaw',
  'Permit Package',
  'Consultants/Contractors',
  'Scope/Extras',
  'Contacts',
  'General',
];

const TITLE_LABELS = { Email: 'Subject', 'Meeting Notes': 'Meeting Name', 'Project Note': 'Title' };

const BODY_PLACEHOLDERS = {
  'Daily Activity': "What happened today? Use bullet points per person, e.g.\n**James:**\n- Called the client about...",
  'Work Plan': 'Outline the plan and add tasks below.',
  Email: 'Paste or summarize the email content...',
  'Meeting Notes': 'Summarize what was discussed...',
  'Project Note': 'Add the reference note...',
};

const overlay = document.getElementById('compose-modal');
const form = document.getElementById('compose-form');
const closeBtn = document.getElementById('compose-close');

let context = null; // { job, author, staffList }
let selectedType = 'Daily Activity';
let selectedDirection = 'Incoming';
let taskRows = [];
let submitting = false;
let onSubmitCb = null;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function field(labelText, control) {
  const wrap = el('div', 'field');
  const label = el('label', 'field-label', labelText);
  wrap.append(label, control);
  return wrap;
}

function staffOptions(staffList, selectedId) {
  let html = '<option value="">— Unassigned —</option>';
  staffList.forEach((s) => {
    html += `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.fullName || s.firstName}</option>`;
  });
  return html;
}

function renderTaskRow(row) {
  const wrap = el('div', 'task-row-edit');
  wrap.dataset.rowId = row.id;

  const nameInput = el('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Task name';
  nameInput.value = row.task;
  nameInput.addEventListener('input', () => { row.task = nameInput.value; });

  const dueInput = el('input');
  dueInput.type = 'date';
  dueInput.value = row.dueDate || '';
  dueInput.addEventListener('input', () => { row.dueDate = dueInput.value; });

  const assignSelect = el('select', null, staffOptions(context.staffList, row.assignedTo));
  assignSelect.addEventListener('change', () => { row.assignedTo = assignSelect.value; });

  const removeBtn = el('button', 'task-row-remove', '&times;');
  removeBtn.type = 'button';
  removeBtn.addEventListener('click', () => {
    taskRows = taskRows.filter((r) => r.id !== row.id);
    renderTaskRows();
  });

  wrap.append(nameInput, dueInput, assignSelect, removeBtn);
  return wrap;
}

function renderTaskRows() {
  const container = form.querySelector('#task-rows-container');
  if (!container) return;
  container.innerHTML = '';
  taskRows.forEach((row) => container.appendChild(renderTaskRow(row)));
}

function addTaskRow() {
  taskRows.push({ id: `t${Date.now()}${Math.random()}`, task: '', dueDate: '', assignedTo: '' });
  renderTaskRows();
}

function updateVisibility() {
  form.querySelectorAll('[data-for-type]').forEach((node) => {
    const types = node.dataset.forType.split(',');
    node.hidden = !types.includes(selectedType);
  });
  form.querySelectorAll('[data-except-type]').forEach((node) => {
    const types = node.dataset.exceptType.split(',');
    node.hidden = types.includes(selectedType);
  });

  const bodyInput = form.querySelector('#compose-body');
  if (bodyInput) bodyInput.placeholder = BODY_PLACEHOLDERS[selectedType] || '';

  const titleLabel = form.querySelector('#compose-title-label');
  if (titleLabel) titleLabel.textContent = TITLE_LABELS[selectedType] || 'Title';

  form.querySelectorAll('#compose-type-segmented button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.value === selectedType);
  });
  form.querySelectorAll('#compose-direction-segmented button').forEach((b) => {
    b.classList.toggle('is-active', b.dataset.value === selectedDirection);
  });
}

function buildForm() {
  form.innerHTML = '';

  const errorBox = el('div', 'compose-error');
  errorBox.hidden = true;
  errorBox.id = 'compose-error';
  form.appendChild(errorBox);

  form.appendChild(field('Job', el('div', 'field-static', `${context.job.jobNumber} · ${context.job.jobName || context.job.jobNameNo}`)));

  const typeSeg = el('div', 'segmented');
  typeSeg.id = 'compose-type-segmented';
  ['Daily Activity', 'Work Plan', 'Email', 'Meeting Notes', 'Project Note'].forEach((t) => {
    const b = el('button', null, t);
    b.type = 'button';
    b.dataset.value = t;
    b.addEventListener('click', () => { selectedType = t; updateVisibility(); });
    typeSeg.appendChild(b);
  });
  form.appendChild(field('Type', typeSeg));

  const dateWrap = el('div', 'field');
  dateWrap.dataset.exceptType = 'Project Note';
  const dateLabel = el('label', 'field-label', 'Entry Date');
  const dateInput = el('input');
  dateInput.type = 'date';
  dateInput.id = 'compose-date';
  dateInput.value = todayISO();
  dateWrap.append(dateLabel, dateInput);
  form.appendChild(dateWrap);

  const emailWrap = el('div', 'field');
  emailWrap.dataset.forType = 'Email';
  const dirSeg = el('div', 'segmented');
  dirSeg.id = 'compose-direction-segmented';
  ['Incoming', 'Outgoing'].forEach((d) => {
    const b = el('button', null, d);
    b.type = 'button';
    b.dataset.value = d;
    b.addEventListener('click', () => { selectedDirection = d; updateVisibility(); });
    dirSeg.appendChild(b);
  });
  emailWrap.append(el('label', 'field-label', 'Direction'), dirSeg);
  form.appendChild(emailWrap);

  const titleWrap = el('div', 'field');
  titleWrap.dataset.forType = 'Email,Meeting Notes,Project Note';
  const titleLabel = el('label', 'field-label', 'Title');
  titleLabel.id = 'compose-title-label';
  const titleInput = el('input');
  titleInput.type = 'text';
  titleInput.id = 'compose-title';
  titleWrap.append(titleLabel, titleInput);
  form.appendChild(titleWrap);

  const transcriptWrap = el('div', 'field');
  transcriptWrap.dataset.forType = 'Meeting Notes';
  const transcriptInput = el('input');
  transcriptInput.type = 'url';
  transcriptInput.id = 'compose-transcript';
  transcriptInput.placeholder = 'https://…';
  transcriptWrap.append(el('label', 'field-label', 'Transcript Link'), transcriptInput);
  form.appendChild(transcriptWrap);

  const categoryWrap = el('div', 'field');
  categoryWrap.dataset.forType = 'Project Note';
  const categorySelect = el('select', null, `<option value="">—</option>${CATEGORY_CHOICES.map((c) => `<option value="${c}">${c}</option>`).join('')}`);
  categorySelect.id = 'compose-category';
  categoryWrap.append(el('label', 'field-label', 'Category'), categorySelect);
  form.appendChild(categoryWrap);

  const bodyWrap = el('div', 'field');
  const bodyTextarea = el('textarea');
  bodyTextarea.id = 'compose-body';
  bodyWrap.append(el('label', 'field-label', 'Body'), bodyTextarea);
  form.appendChild(bodyWrap);

  const workPlanWrap = el('div', 'field');
  workPlanWrap.dataset.forType = 'Work Plan';
  const rowsContainer = el('div', 'task-rows');
  rowsContainer.id = 'task-rows-container';
  const addBtn = el('button', 'add-task-btn', '+ Add task');
  addBtn.type = 'button';
  addBtn.addEventListener('click', addTaskRow);
  workPlanWrap.append(el('label', 'field-label', 'Tasks'), rowsContainer, addBtn);
  form.appendChild(workPlanWrap);

  const statusWrap = el('div', 'field');
  const statusSelect = el('select', null, '<option value="General">General</option><option value="Important">Important</option><option value="Archived">Archived</option>');
  statusSelect.id = 'compose-status';
  statusWrap.append(el('label', 'field-label', 'Status'), statusSelect);
  form.appendChild(statusWrap);

  form.appendChild(field('Author', el('div', 'field-static', context.author.fullName)));

  const actions = el('div', 'form-actions');
  const cancelBtn = el('button', 'btn', 'Cancel');
  cancelBtn.type = 'button';
  cancelBtn.addEventListener('click', closeCompose);
  const submitBtn = el('button', 'btn btn-primary', 'Save Entry');
  submitBtn.type = 'submit';
  submitBtn.id = 'compose-submit';
  actions.append(cancelBtn, submitBtn);
  form.appendChild(actions);
}

function showError(message) {
  const box = form.querySelector('#compose-error');
  if (box) {
    box.textContent = message;
    box.hidden = false;
  }
}

function setSubmitting(isSubmitting) {
  submitting = isSubmitting;
  const btn = form.querySelector('#compose-submit');
  if (btn) {
    btn.disabled = isSubmitting;
    btn.textContent = isSubmitting ? 'Saving…' : 'Save Entry';
  }
}

async function handleSubmit(evt) {
  evt.preventDefault();
  if (submitting) return;

  const box = form.querySelector('#compose-error');
  if (box) box.hidden = true;

  const bodyValue = form.querySelector('#compose-body').value.trim();
  const dateValue = form.querySelector('#compose-date').value;
  const titleValue = (form.querySelector('#compose-title')?.value || '').trim();
  const transcriptValue = (form.querySelector('#compose-transcript')?.value || '').trim();
  const categoryValue = form.querySelector('#compose-category')?.value || '';
  const statusValue = form.querySelector('#compose-status').value;

  if (!bodyValue) return showError('Body is required.');
  if (selectedType !== 'Project Note' && !dateValue) return showError('Entry Date is required.');
  if (selectedType === 'Project Note' && !titleValue) return showError('Title is required for Project Note.');
  if (selectedType === 'Work Plan' && taskRows.some((r) => !r.task.trim())) {
    return showError('Every task row needs a task name, or remove the empty row.');
  }

  const payload = {
    jobId: context.job.id,
    type: selectedType,
    date: selectedType === 'Project Note' ? '' : dateValue,
    body: bodyValue,
    authorId: context.author.recordId,
    status: statusValue,
    title: titleValue,
    emailDirection: selectedType === 'Email' ? selectedDirection : '',
    transcriptLink: selectedType === 'Meeting Notes' ? transcriptValue : '',
    category: selectedType === 'Project Note' ? categoryValue : '',
  };

  setSubmitting(true);
  try {
    const created = await createEntry(payload);

    if (selectedType === 'Work Plan' && taskRows.length) {
      const tasksPayload = taskRows
        .filter((r) => r.task.trim())
        .map((r) => ({
          workPlanEntryId: created.id,
          task: r.task.trim(),
          dueDate: r.dueDate || undefined,
          assignedTo: r.assignedTo || undefined,
          assignedBy: context.author.recordId,
        }));
      if (tasksPayload.length) {
        try {
          await createTasks(tasksPayload);
        } catch {
          // Entry is already saved; surface a toast rather than blocking close.
          if (onSubmitCb) onSubmitCb({ partialTaskFailure: true });
        }
      }
    }

    setSubmitting(false);
    closeCompose();
    if (onSubmitCb) onSubmitCb({ success: true });
  } catch (err) {
    setSubmitting(false);
    showError(err.message || 'Entry could not be saved. Check your connection and try again.');
  }
}

export function initCompose({ onSubmit }) {
  onSubmitCb = onSubmit;
  closeBtn.addEventListener('click', closeCompose);
  overlay.addEventListener('click', (evt) => {
    if (evt.target === overlay) closeCompose();
  });
  form.addEventListener('submit', handleSubmit);
}

export function openCompose({ job, author, staffList }) {
  context = { job, author, staffList };
  selectedType = 'Daily Activity';
  selectedDirection = 'Incoming';
  taskRows = [];
  buildForm();
  updateVisibility();
  overlay.hidden = false;
}

export function closeCompose() {
  overlay.hidden = true;
}
