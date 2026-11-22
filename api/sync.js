// Vercel Serverless Function for UNT 140 Cloud Sync (Supabase + Serverless Memory Store)
// Endpoint: /api/sync
// Supports: GET /api/sync?key=STUDENT_ID
//           POST /api/sync { key: STUDENT_ID, state: { ... } }

const memoryStore = new Map();

export default async function handler(req, res) {
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

  const { searchParams } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const bodyObj = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (e) { return {}; } })() : (req.body || {});
  const key = (searchParams.get('key') || bodyObj.key || '').trim().toUpperCase();

  if (!key) {
    return res.status(400).json({ error: 'Синхрондау кілті (key) қажет' });
  }

  const sbUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // GET: Retrieve state
  if (req.method === 'GET') {
    if (sbUrl && sbKey) {
      try {
        const sbRes = await fetch(`${sbUrl}/rest/v1/ubt_sync?sync_key=eq.${encodeURIComponent(key)}&select=*`, {
          headers: {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`
          }
        });
        if (sbRes.ok) {
          const rows = await sbRes.json();
          if (rows && rows.length > 0 && rows[0].state_data) {
            return res.status(200).json({
              success: true,
              source: 'supabase',
              key,
              found: true,
              data: rows[0].state_data,
              updatedAt: rows[0].updated_at
            });
          }
        }
      } catch (err) {
        console.warn('Supabase GET fallback to memory:', err);
      }
    }

    const data = memoryStore.get(key) || null;
    return res.status(200).json({
      success: true,
      source: 'vercel-memory',
      key,
      found: !!data,
      data: data ? data.state : null,
      updatedAt: data ? data.updatedAt : null
    });
  }

  // POST: Update state
  if (req.method === 'POST') {
    const state = bodyObj.state;
    if (!state) {
      return res.status(400).json({ error: 'Сақталатын деректер (state) табылмады' });
    }

    const updatedAt = new Date().toISOString();
    memoryStore.set(key, { state, updatedAt });

    if (sbUrl && sbKey) {
      try {
        await fetch(`${sbUrl}/rest/v1/ubt_sync`, {
          method: 'POST',
          headers: {
            'apikey': sbKey,
            'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            sync_key: key,
            state_data: state,
            updated_at: updatedAt
          })
        });
      } catch (err) {
        console.warn('Supabase POST error:', err);
      }
    }

    return res.status(200).json({
      success: true,
      key,
      updatedAt
    });
  }

  return res.status(405).json({ error: 'Әдіс қолдау таппайды' });
}
