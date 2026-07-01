const { getRecordById, createRecords } = require('./_lib/airtable');
const { TABLES, ENTRIES, JOBS, RECORD_ID_RE, ENTRY_TYPES, ENTRY_STATUSES, EMAIL_DIRECTIONS, CATEGORY_CHOICES } = require('./_lib/schema');
const { splitJobNameNo, mapEntry } = require('./_lib/mappers');

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const body = req.body || {};
  const {
    jobId,
    type,
    date,
    body: entryBody,
    authorId,
    status,
    title,
    emailDirection,
    transcriptLink,
    category,
  } = body;

  if (!RECORD_ID_RE.test(jobId || '')) {
    res.status(400).json({ error: 'A valid jobId is required.' });
    return;
  }
  if (!ENTRY_TYPES.includes(type)) {
    res.status(400).json({ error: 'A valid Type is required.' });
    return;
  }
  if (!entryBody || !String(entryBody).trim()) {
    res.status(400).json({ error: 'Body is required.' });
    return;
  }
  if (!RECORD_ID_RE.test(authorId || '')) {
    res.status(400).json({ error: 'A valid authorId is required.' });
    return;
  }
  if (status && !ENTRY_STATUSES.includes(status)) {
    res.status(400).json({ error: 'Invalid Status.' });
    return;
  }
  if (type !== 'Project Note' && !ISO_DATE_RE.test(date || '')) {
    res.status(400).json({ error: 'A valid Entry Date is required for this Type.' });
    return;
  }
  if (type === 'Project Note' && !(title && String(title).trim())) {
    res.status(400).json({ error: 'Title is required for Project Note.' });
    return;
  }
  if (type === 'Email' && !EMAIL_DIRECTIONS.includes(emailDirection)) {
    res.status(400).json({ error: 'Email Direction is required for Email entries.' });
    return;
  }
  if (type === 'Project Note' && category && !CATEGORY_CHOICES.includes(category)) {
    res.status(400).json({ error: 'Invalid Category.' });
    return;
  }

  try {
    const jobRecord = await getRecordById(TABLES.JOBS, jobId);
    if (!jobRecord) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }
    const { jobNumber } = splitJobNameNo(jobRecord.fields[JOBS.NAME]);

    const trimmedTitle = title && String(title).trim();
    const entryLabel = type === 'Project Note'
      ? `${jobNumber} · ${type} · ${trimmedTitle}`
      : `${jobNumber} · ${date} · ${type}`;

    const fields = {
      [ENTRIES.ENTRY]: entryLabel,
      [ENTRIES.BODY]: entryBody,
      [ENTRIES.AUTHOR]: [authorId],
      [ENTRIES.STATUS]: status || 'General',
      [ENTRIES.JOB]: [jobId],
      [ENTRIES.TYPE]: type,
    };

    if (type !== 'Project Note') {
      fields[ENTRIES.ENTRY_DATE] = date;
    }
    if (trimmedTitle && ['Email', 'Meeting Notes', 'Project Note'].includes(type)) {
      fields[ENTRIES.TITLE] = trimmedTitle;
    }
    if (type === 'Email') {
      fields[ENTRIES.EMAIL_DIRECTION] = emailDirection;
    }
    if (type === 'Meeting Notes' && transcriptLink && String(transcriptLink).trim()) {
      fields[ENTRIES.TRANSCRIPT_LINK] = String(transcriptLink).trim();
    }
    if (type === 'Project Note' && category) {
      fields[ENTRIES.CATEGORY] = category;
    }

    const [created] = await createRecords(TABLES.ENTRIES, [{ fields }]);
    res.status(201).json(mapEntry(created));
  } catch (err) {
    console.error('POST /api/entry failed:', err);
    res.status(500).json({ error: 'Entry could not be saved. Check your connection and try again.' });
  }
};
