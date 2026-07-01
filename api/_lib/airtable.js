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
// to keep each filterByFormula string short.
async function getRecordsByIds(tableId, ids) {
  if (!ids.length) return [];
  const { baseId } = getConfig();
  const chunkSize = 40;
  const results = [];

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()="${id}"`).join(',')})`;
    const params = new URLSearchParams({
      filterByFormula: formula,
      returnFieldsByFieldId: 'true',
      pageSize: '100',
    });
    const data = await airtableFetch(`/${baseId}/${tableId}?${params.toString()}`);
    results.push(...(data.records || []));
  }

  return results;
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

async function createRecords(tableId, records) {
  const { baseId } = getConfig();
  const data = await airtableFetch(`/${baseId}/${tableId}`, {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
  return data.records;
}

async function updateRecord(tableId, recordId, fields) {
  const { baseId } = getConfig();
  return airtableFetch(`/${baseId}/${tableId}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

module.exports = {
  airtableFetch,
  listAllRecords,
  getRecordsByIds,
  getRecordById,
  createRecords,
  updateRecord,
};
