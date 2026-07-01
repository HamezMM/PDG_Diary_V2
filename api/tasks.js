const { createRecords, updateRecord } = require('./_lib/airtable');
const { TABLES, TASKS, TASK_STATUSES, RECORD_ID_RE } = require('./_lib/schema');
const { mapTask } = require('./_lib/mappers');

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function handleCreate(req, res) {
  const tasks = Array.isArray(req.body) ? req.body : [];
  if (!tasks.length) {
    res.status(400).json({ error: 'At least one task is required.' });
    return;
  }

  for (const t of tasks) {
    if (!RECORD_ID_RE.test(t?.workPlanEntryId || '') || !(t?.task && String(t.task).trim())) {
      res.status(400).json({ error: 'Each task needs a workPlanEntryId and a task name.' });
      return;
    }
  }

  try {
    const records = tasks.map((t) => {
      const fields = {
        [TASKS.TASK]: String(t.task).trim(),
        [TASKS.WORK_PLAN_ENTRY]: [t.workPlanEntryId],
        [TASKS.COMPLETE]: 'Open',
      };
      if (t.details && String(t.details).trim()) fields[TASKS.DETAILS] = String(t.details).trim();
      if (RECORD_ID_RE.test(t.assignedTo || '')) fields[TASKS.ASSIGNED_TO] = [t.assignedTo];
      if (RECORD_ID_RE.test(t.assignedBy || '')) fields[TASKS.ASSIGNED_BY] = [t.assignedBy];
      if (t.dueDate) fields[TASKS.DUE_DATE] = t.dueDate;
      return { fields };
    });

    const created = await createRecords(TABLES.TASKS, records);
    res.status(201).json(created.map(mapTask));
  } catch (err) {
    console.error('POST /api/tasks failed:', err);
    res.status(500).json({ error: 'Tasks could not be saved.' });
  }
}

async function handleUpdate(req, res) {
  const { recordId, complete, dateDone, completedBy } = req.body || {};

  if (!RECORD_ID_RE.test(recordId || '')) {
    res.status(400).json({ error: 'A valid recordId is required.' });
    return;
  }
  if (!TASK_STATUSES.includes(complete)) {
    res.status(400).json({ error: 'A valid Complete value (Open or Done) is required.' });
    return;
  }

  try {
    const fields = { [TASKS.COMPLETE]: complete };
    if (complete === 'Done') {
      fields[TASKS.DATE_DONE] = dateDone || todayISO();
      fields[TASKS.COMPLETED_BY] = RECORD_ID_RE.test(completedBy || '') ? [completedBy] : [];
    } else {
      fields[TASKS.DATE_DONE] = null;
      fields[TASKS.COMPLETED_BY] = [];
    }

    const updated = await updateRecord(TABLES.TASKS, recordId, fields);
    res.status(200).json(mapTask(updated));
  } catch (err) {
    console.error('PATCH /api/tasks failed:', err);
    res.status(500).json({ error: 'Task update failed.' });
  }
}

module.exports = async function handler(req, res) {
  if (req.method === 'POST') return handleCreate(req, res);
  if (req.method === 'PATCH') return handleUpdate(req, res);
  res.status(405).json({ error: 'Method not allowed.' });
};
