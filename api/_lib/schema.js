// Ground-truth Airtable schema (table + field IDs). Verified live 2026-07-01.
// Field IDs are used everywhere instead of field names, since names carry
// relational annotations (e.g. "Author [→ T13_Staff]") that can churn as the
// base evolves. Airtable's REST API accepts either name or id in all of
// these positions, so this insulates the app from renames.

const TABLES = {
  ENTRIES: 'tblr6t2AQJ5wVqX8I',
  TASKS: 'tblf9bOscnOfznKwn',
  JOBS: 'tbllWaz4C6XOkWf0r',
  STAFF: 'tbl1EyvanEkFMYAH7',
};

const ENTRIES = {
  ENTRY: 'fldZIAaszejvyY6I5',
  BODY: 'fldpngTJIfOXf4UMi',
  AUTHOR: 'fldxAsJEPhFaVpPr6',
  STATUS: 'fldCMk3aAdEEwGdXK',
  JOB: 'fldQg1Gxj8K0IXMSE',
  TYPE: 'fldf8rV95jvOYBnmg',
  ENTRY_DATE: 'fldw4EoGCr6yUXl1V',
  TITLE: 'fldziv9zZRSp4bJ3t',
  EMAIL_DIRECTION: 'fldlj2nrcmOPDHIcB',
  TRANSCRIPT_LINK: 'fldTrhM32oUh6e7lj',
  CATEGORY: 'fldub6IJvaQJhv2ED',
  TASKS: 'fldcdj0Da8QpwnDIJ',
  JOB_STATUS_LOOKUP: 'fldBmURpv75lreHtG',
  PROJECT_STATUS_LOOKUP: 'fldvYJ14lkfxnIzZl',
};

const TASKS = {
  TASK: 'fldBGvLOFGH8plpZI',
  DETAILS: 'fldYVdMxhdR7Kw2aN',
  ASSIGNED_TO: 'fldgORVYiFOJGt6fp',
  ASSIGNED_BY: 'flds3ByWavXU85QMI',
  COMPLETED_BY: 'fldf0mjjAcCmqH8jx',
  BLOCKERS: 'fld6dPXHrtMv0YuYu',
  DUE_DATE: 'fldLsGshrW5A8IQ49',
  DATE_DONE: 'flduVCz1PnJyQZ1VY',
  COMPLETE: 'fldGSJv2gOIvIIyM9',
  WORK_PLAN_ENTRY: 'fldQNeg6T9U4zZedT',
  // Deliverable link (fldagoekwcDewPoha) is V2 — intentionally not surfaced.
};

const JOBS = {
  NAME: 'fldNtqEZtTZYsPL8e',
  PROP_STATUS: 'fldaKHaiRAfd15rl3',
  PRJT_STATUS: 'fldjOUq8p3s6I8P0R',
  MAIN_SECTOR: 'fldWI9XeCilesrkQs',
  SUB_TYPES: 'fldPWwKVOglIMvkZ4',
  REQUIRES_MATTERPORT: 'fldxLyRSgZrzrDMeF',
  REQUIRES_POINT_CLOUD: 'fldPl1HGCCRd7Hkhc',
  REQUIRES_DP: 'fldNrhU9M9DA5n5AU',
  REQUIRES_BP: 'fldLe3O2cYHbEcOvo',
  DELIVERABLE_TYPES: 'fldRwI8gAQRFPDUpT',
};

const STAFF = {
  FIRST_NAME: 'fld3Ox31JgsO2dLgU',
  FULL_NAME: 'fldkT4YRjdQM1AZUj',
  POSITION: 'fldQ1ohIDMmV7fvCk',
  EMAIL: 'fldZkaN2YoEGZIMPH',
  PHOTO: 'fld2zHWfEfIbJ3Ona',
  // Hourly Rate (fldzNcBWZUqi2ynos) and Burdened Rate (fldOKcpCecQUeQidl)
  // must never be requested from the Staff table.
};

const RECORD_ID_RE = /^rec[A-Za-z0-9]{14,}$/;

const ENTRY_TYPES = ['Daily Activity', 'Work Plan', 'Email', 'Meeting Notes', 'Project Note'];
const ENTRY_STATUSES = ['General', 'Important', 'Archived'];
const EMAIL_DIRECTIONS = ['Incoming', 'Outgoing'];
// Live choice list as of 2026-07-01 (post 6-11 review) — supersedes the
// stale "Site, Client, Permits" list in the original tech-req draft.
const CATEGORY_CHOICES = [
  'Code/Bylaw',
  'Permit Package',
  'Consultants/Contractors',
  'Scope/Extras',
  'Contacts',
  'General',
];
const TASK_STATUSES = ['Open', 'Done'];

module.exports = {
  TABLES,
  ENTRIES,
  TASKS,
  JOBS,
  STAFF,
  RECORD_ID_RE,
  ENTRY_TYPES,
  ENTRY_STATUSES,
  EMAIL_DIRECTIONS,
  CATEGORY_CHOICES,
  TASK_STATUSES,
};
