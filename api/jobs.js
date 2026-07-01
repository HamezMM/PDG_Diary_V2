const { listAllRecords } = require('./_lib/airtable');
const { TABLES, JOBS } = require('./_lib/schema');
const { mapJob } = require('./_lib/mappers');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const records = await listAllRecords(TABLES.JOBS, { fields: Object.values(JOBS) });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(records.map(mapJob));
  } catch (err) {
    console.error('GET /api/jobs failed:', err);
    res.status(500).json({ error: 'Could not load jobs. Refresh to try again.' });
  }
};
