const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require('os');
const { spawn } = require('child_process');

const PORT = 3140;
const UBT_DESKTOP_DIR = 'C:\\Users\\user\\Desktop\\ҰБТ';
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'user_state.json');
const TUNNEL_FILE = path.join(DATA_DIR, 'tunnel_url.txt');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// ЖЕЛІ ЖӘНЕ АВТОМАТТЫ ОНЛАЙН ТУННЕЛЬ (ТЕЛЕФОН / НОУТБУК / КЕЗ КЕЛГЕН ГАДЖЕТ)
// ============================================================================
let activePublicUrl = '';
let tunnelProcess = null;
let tunnelStatus = 'connecting';

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function startPublicTunnel() {
  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch (e) {}
    tunnelProcess = null;
  }
  tunnelStatus = 'connecting';
  const sshPath = fs.existsSync('C:\\Windows\\System32\\OpenSSH\\ssh.exe')
    ? 'C:\\Windows\\System32\\OpenSSH\\ssh.exe'
    : 'ssh';

  const args = [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=/dev/null',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ExitOnForwardFailure=yes',
    '-R', `80:127.0.0.1:${PORT}`,
    'nokey@localhost.run'
  ];

  try {
    tunnelProcess = spawn(sshPath, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });

    const handleOutput = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
      if (match && match[0]) {
        activePublicUrl = match[0];
        tunnelStatus = 'online';
        try { fs.writeFileSync(TUNNEL_FILE, activePublicUrl, 'utf8'); } catch (e) {}
        console.log(`🌍 ОНЛАЙН СІЛТЕМЕ (Кез келген гаджет / 4G / 5G): ${activePublicUrl}`);
      }
    };

    tunnelProcess.stdout.on('data', handleOutput);
    tunnelProcess.stderr.on('data', handleOutput);

    tunnelProcess.on('close', () => {
      tunnelStatus = 'reconnecting';
      tunnelProcess = null;
      setTimeout(startPublicTunnel, 5000);
    });

    tunnelProcess.on('error', (err) => {
      tunnelStatus = 'error';
      console.error('Tunnel error:', err.message);
    });
  } catch (err) {
    tunnelStatus = 'error';
    console.error('Failed to spawn ssh tunnel:', err.message);
  }
}

const DEFAULT_STATE = {
  studentName: 'Болашақ Грант Иегері (ФизМат)',
  targetScore: 130,
  startDate: '2026-11-02',
  examDate: '2027-03-31',
  streak: 1,
  lastActiveDate: '2026-11-02',
  totalFocusMinutes: 0,
  currentMonth: 1,
  currentWeek: 1,
  currentDay: 1,
  completedDays: {},
  completedBlocks: {},
  homeworkChecks: {},
  testHistory: [
    {
      id: 'diag-0',
      date: '2026-11-01',
      type: 'diagnostic',
      title: 'Бастапқы диагностика (Старт)',
      score: 78,
      maxScore: 130,
      breakdown: { phys: 28, math: 26, hist: 15, msl: 9 }
    }
  ],
  errorBank: [],
  customQuestions: [],
  notes: {}
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading state:', e);
  }
  return DEFAULT_STATE;
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error saving state:', e);
    return false;
  }
}

function scanUbtBooks(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results = results.concat(scanUbtBooks(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      const stat = fs.statSync(fullPath);
      const folder = path.dirname(relPath);
      results.push({
        name: entry.name,
        relPath,
        folder: folder === '.' ? 'Негізгі папка (Түбір)' : folder,
        size: stat.size,
        isEmpty: stat.size === 0,
        sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
      });
    }
  }
  return results;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Network & Multi-Gadget Access Info (Phone / Laptop / Tablet)
  if (pathname === '/api/network') {
    if (req.method === 'POST') {
      startPublicTunnel();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, status: 'reconnecting' }));
      return;
    }
    const lanIp = getLanIp();
    const lanUrl = `http://${lanIp}:${PORT}`;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      lanIp,
      lanUrl,
      localUrl: `http://localhost:${PORT}`,
      publicUrl: activePublicUrl || null,
      tunnelStatus
    }));
    return;
  }

  // API: Get or save state
  if (pathname === '/api/state') {
    if (req.method === 'GET') {
      const state = loadState();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(state));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const incoming = JSON.parse(body);
          const current = loadState();
          const updated = { ...current, ...incoming };
          saveState(updated);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, state: updated }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }
  }

  // API: List all PDF books from Desktop\ҰБТ
  if (pathname === '/api/books' && req.method === 'GET') {
    const books = scanUbtBooks(UBT_DESKTOP_DIR);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ baseDir: UBT_DESKTOP_DIR, books }));
    return;
  }

  // API: Stream PDF with HTTP Range support for instant page jumping
  if (pathname === '/api/pdf' && req.method === 'GET') {
    const rel = parsedUrl.query.file;
    if (!rel) {
      res.writeHead(400);
      res.end('Missing file parameter');
      return;
    }
    const safeRel = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
    const targetPath = path.join(UBT_DESKTOP_DIR, safeRel);
    if (!targetPath.startsWith(UBT_DESKTOP_DIR) || !fs.existsSync(targetPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Файл табылмады: ' + safeRel);
      return;
    }
    const stat = fs.statSync(targetPath);
    if (stat.size === 0) {
      res.writeHead(422, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family:sans-serif;padding:40px;color:#e2e8f0;background:#0f172a;height:100vh;">
          <h2 style="color:#f59e0b;">⚠️ Бұл PDF файл бос (0 байт)</h2>
          <p>Файл: <code>${targetPath}</code></p>
          <p>Жұмыс үстеліндегі бұл файл толық жүктелмей қалған (0 КБ). Уайымдама! Осы тақырыптың <b>толық теориясы, даталары, формулалары мен тесттері</b> платформаның «Түсіндірме (На изи)» бөліміне толық енгізілген.</p>
        </div>
      `);
      return;
    }

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(targetPath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf'
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Content-Type': 'application/pdf'
      });
      fs.createReadStream(targetPath).pipe(res);
    }
    return;
  }

  // Static files from public/
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const lanIp = getLanIp();
  console.log(`====================================================`);
  console.log(`🚀 ҰБТ 130/130 ФИЗМАТ ПЛАТФОРМАСЫ ІСКЕ ҚОСЫЛДЫ!`);
  console.log(`💻 Ноутбукте:     http://localhost:${PORT}`);
  console.log(`📱 Wi-Fi желіде:  http://${lanIp}:${PORT}`);
  console.log(`📚 Кітаптар папкасы: ${UBT_DESKTOP_DIR}`);
  console.log(`====================================================`);
  startPublicTunnel();
});
