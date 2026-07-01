const { ENTRIES, TASKS, JOBS, STAFF } = require('./schema');

// "JOB NAME & NO" is stored as "{YY}-{NNN} CLIENT NAME" in one field.
function splitJobNameNo(raw) {
  const text = (raw || '').trim();
  const match = text.match(/^(\S+)\s+([\s\S]*)$/);
  if (match) return { jobNumber: match[1], jobName: match[2].trim() };
  return { jobNumber: text, jobName: '' };
}

function firstLinked(value) {
  return Array.isArray(value) && value.length ? value[0] : null;
}

function mapJob(record) {
  const f = record.fields;
  const raw = f[JOBS.NAME] || '';
  const { jobNumber, jobName } = splitJobNameNo(raw);
  return {
    id: record.id,
    jobNameNo: raw,
    jobNumber,
    jobName,
    propStatus: f[JOBS.PROP_STATUS] || null,
    prjtStatus: f[JOBS.PRJT_STATUS] || null,
    mainSector: f[JOBS.MAIN_SECTOR] || null,
    subTypes: f[JOBS.SUB_TYPES] || null,
    requiresMatterport: !!f[JOBS.REQUIRES_MATTERPORT],
    requiresPointCloud: !!f[JOBS.REQUIRES_POINT_CLOUD],
    requiresDP: !!f[JOBS.REQUIRES_DP],
    requiresBP: !!f[JOBS.REQUIRES_BP],
    deliverableTypes: f[JOBS.DELIVERABLE_TYPES] || [],
  };
}

function mapStaff(record) {
  const f = record.fields;
  const photos = f[STAFF.PHOTO] || [];
  const photo = photos[0];
  return {
    id: record.id,
    firstName: f[STAFF.FIRST_NAME] || '',
    fullName: f[STAFF.FULL_NAME] || '',
    position: f[STAFF.POSITION] || '',
    email: f[STAFF.EMAIL] || '',
    photoUrl: (photo && (photo.thumbnails?.large?.url || photo.thumbnails?.small?.url || photo.url)) || null,
  };
}

function mapTask(record) {
  const f = record.fields;
  return {
    id: record.id,
    task: f[TASKS.TASK] || '',
    details: f[TASKS.DETAILS] || '',
    assignedToId: firstLinked(f[TASKS.ASSIGNED_TO]),
    assignedById: firstLinked(f[TASKS.ASSIGNED_BY]),
    completedById: firstLinked(f[TASKS.COMPLETED_BY]),
    blockers: f[TASKS.BLOCKERS] || '',
    dueDate: f[TASKS.DUE_DATE] || null,
    dateDone: f[TASKS.DATE_DONE] || null,
    complete: f[TASKS.COMPLETE] || 'Open',
    workPlanEntryId: firstLinked(f[TASKS.WORK_PLAN_ENTRY]),
  };
}

function mapEntry(record) {
  const f = record.fields;
  return {
    id: record.id,
    entryLabel: f[ENTRIES.ENTRY] || '',
    body: f[ENTRIES.BODY] || '',
    authorId: firstLinked(f[ENTRIES.AUTHOR]),
    status: f[ENTRIES.STATUS] || 'General',
    jobId: firstLinked(f[ENTRIES.JOB]),
    type: f[ENTRIES.TYPE] || '',
    entryDate: f[ENTRIES.ENTRY_DATE] || null,
    title: f[ENTRIES.TITLE] || '',
    emailDirection: f[ENTRIES.EMAIL_DIRECTION] || null,
    transcriptLink: f[ENTRIES.TRANSCRIPT_LINK] || null,
    category: f[ENTRIES.CATEGORY] || null,
    taskIds: f[ENTRIES.TASKS] || [],
    tasks: [],
    jobStatus: (f[ENTRIES.JOB_STATUS_LOOKUP] || [])[0] || null,
    projectStatus: (f[ENTRIES.PROJECT_STATUS_LOOKUP] || [])[0] || null,
    createdTime: record.createdTime,
  };
}

module.exports = { splitJobNameNo, mapJob, mapStaff, mapTask, mapEntry };
