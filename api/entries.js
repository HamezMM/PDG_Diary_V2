const { listAllRecords, getRecordsByIds } = require('./_lib/airtable');
const { TABLES, ENTRIES, RECORD_ID_RE } = require('./_lib/schema');
const { mapEntry, mapTask } = require('./_lib/mappers');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : '';
  if (!RECORD_ID_RE.test(jobId)) {
    res.status(400).json({ error: 'A valid jobId query parameter is required.' });
    return;
  }

  try {
    // Airtable linked-record fields resolve to primary-field text (not IDs)
    // inside filterByFormula, so job-scoping is done here in code instead.
    const allEntries = await listAllRecords(TABLES.ENTRIES, { fields: Object.values(ENTRIES) });
    const jobEntries = allEntries.filter((r) => (r.fields[ENTRIES.JOB] || []).includes(jobId));
    const mapped = jobEntries.map(mapEntry);

    const workPlanEntries = mapped.filter((e) => e.type === 'Work Plan');
    const taskIds = [...new Set(workPlanEntries.flatMap((e) => e.taskIds))];
    if (taskIds.length) {
      const taskRecords = await getRecordsByIds(TABLES.TASKS, taskIds);
      const taskById = new Map(taskRecords.map((r) => [r.id, mapTask(r)]));
      workPlanEntries.forEach((e) => {
        e.tasks = e.taskIds.map((id) => taskById.get(id)).filter(Boolean);
      });
    }

    mapped.sort((a, b) => {
      const dateA = a.entryDate || '';
      const dateB = b.entryDate || '';
      if (dateA !== dateB) return dateA < dateB ? 1 : -1;
      return a.createdTime < b.createdTime ? 1 : -1;
    });

    res.status(200).json(mapped);
  } catch (err) {
    console.error('GET /api/entries failed:', err);
    res.status(500).json({ error: 'Could not load entries for this project.' });
  }
};
