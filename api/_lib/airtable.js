// Thin server-side client for the Airtable REST API. Holds the PAT via
// environment variables only — never touched by the frontend.

const AIRTABLE_API_ROOT = 'https://api.airtable.com/v0';

function getConfig() {
  const apiKey = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error('Server is missing AIRTABLE_PAT / AIRTABLE_BASE_ID configuration.');
  }
  return { apiKey, baseId };
}

async function airtableFetch(path, options = {}) {
  const { apiKey } = getConfig();
  const res = await fetch(`${AIRTABLE_API_ROOT}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.error || res.statusText || 'Airtable request failed.';
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

// Loops internally on Airtable's `offset` cursor so callers always get the
// full record set in one array (Airtable caps a single page at 100).
async function listAllRecords(tableId, { fields, pageSize = 100 } = {}) {
  const { baseId } = getConfig();
  const records = [];
  let offset;

  do {
    const params = new URLSearchParams();
    params.set('returnFieldsByFieldId', 'true');
    params.set('pageSize', String(pageSize));
    if (fields) fields.forEach((f) => params.append('fields[]', f));
    if (offset) params.set('offset', offset);

    const data = await airtableFetch(`/${baseId}/${tableId}?${params.toString()}`);
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

// Fetches a fixed set of records by id via RECORD_ID() OR-formula, chunked
// to keep each filterByFormula string short. Chunks are independent, so they
// fire concurrently rather than one round-trip at a time.
async function getRecordsByIds(tableId, ids) {
  if (!ids.length) return [];
  const { baseId } = getConfig();
  const chunkSize = 40;
  const chunks = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const pages = await Promise.all(chunks.map((chunk) => {
    const formula = `OR(${chunk.map((id) => `RECORD_ID()="${id}"`).join(',')})`;
    const params = new URLSearchParams({
      filterByFormula: formula,
      returnFieldsByFieldId: 'true',
      pageSize: '100',
    });
    return airtableFetch(`/${baseId}/${tableId}?${params.toString()}`);
  }));

  return pages.flatMap((data) => data.records || []);
}

async function getRecordById(tableId, recordId) {
  const { baseId } = getConfig();
  try {
    return await airtableFetch(`/${baseId}/${tableId}/${recordId}?returnFieldsByFieldId=true`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

// Airtable's create/update endpoints return `fields` keyed by field NAME —
// returnFieldsByFieldId only affects GET/list responses — but every mapper
// in mappers.js indexes by field ID. Refetch by id so callers always get the
// same ID-keyed shape regardless of which operation produced the record.
async function createRecords(tableId, records) {
  const { baseId } = getConfig();
  const data = await airtableFetch(`/${baseId}/${tableId}`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
  const ids = data.records.map((r) => r.id);
  const refetched = await getRecordsByIds(tableId, ids);
  const byId = new Map(refetched.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id));
}

async function updateRecord(tableId, recordId, fields) {
  const { baseId } = getConfig();
  await airtableFetch(`/${baseId}/${tableId}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
  return getRecordById(tableId, recordId);
}

module.exports = {
  airtableFetch,
  listAllRecords,
  getRecordsByIds,
  getRecordById,
  createRecords,
  updateRecord,
};
