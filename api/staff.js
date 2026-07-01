const { listAllRecords } = require('./_lib/airtable');
const { TABLES, STAFF } = require('./_lib/schema');
const { mapStaff } = require('./_lib/mappers');

// Only ever request this allowlist — Hourly Rate / Burdened Rate must never
// reach this route, let alone the frontend.
const SAFE_FIELDS = [STAFF.FIRST_NAME, STAFF.FULL_NAME, STAFF.POSITION, STAFF.EMAIL, STAFF.PHOTO];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const records = await listAllRecords(TABLES.STAFF, { fields: SAFE_FIELDS });
    res.status(200).json(records.map(mapStaff));
  } catch (err) {
    console.error('GET /api/staff failed:', err);
    res.status(500).json({ error: 'Could not load staff.' });
  }
};
