// Vercel Serverless Function for UNT 140 Cloud Sync
// Endpoint: /api/sync
// Supports: GET /api/sync?key=STUDENT_ID
//           POST /api/sync { key: STUDENT_ID, state: { ... } }

// In-memory cache for fast serverless responses (can also forward to Supabase / Upstash KV)
const memoryStore = new Map();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const key = searchParams.get('key') || (req.body && req.body.key);

  if (!key) {
    return res.status(400).json({ error: 'Синхрондау кілті (key) қажет' });
  }

  // GET: Retrieve state
  if (req.method === 'GET') {
    const data = memoryStore.get(key) || null;
    return res.status(200).json({
      success: true,
      key,
      found: !!data,
      data: data ? data.state : null,
      updatedAt: data ? data.updatedAt : null
    });
  }

  // POST: Update state
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const state = body.state;

    if (!state) {
      return res.status(400).json({ error: 'Сақталатын деректер (state) табылмады' });
    }

    const payload = {
      state,
      updatedAt: new Date().toISOString()
    };

    memoryStore.set(key, payload);

    return res.status(200).json({
      success: true,
      key,
      updatedAt: payload.updatedAt
    });
  }

  return res.status(405).json({ error: 'Әдіс қолдау таппайды' });
}
