/**
 * Static portfolio server + reviews API (auth + public reviews).
 * Run: node serve.js  →  http://localhost:8765
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./server/db');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const root = __dirname;
const port = Number(process.env.PORT) || 8765;

db.ensureData();

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  let filePath = path.join(root, decoded === '/' ? 'index.html' : decoded.replace(/^\//, ''));

  // block access to data/ and server internals
  const rel = path.relative(root, filePath);
  if (rel.startsWith('data') || rel.startsWith('server') || rel.includes('..')) {
    return null;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    const withIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(withIndex)) filePath = withIndex;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  return filePath;
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 50_000) {
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function getToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7).trim();
  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

async function handleApi(req, res, pathname) {
  const method = req.method || 'GET';

  // CORS for local tools
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  try {
    if (method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/reviews') {
      return sendJson(res, 200, { reviews: db.listReviews() });
    }

    if (method === 'POST' && pathname === '/api/register') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const password = String(body.password || '');

      if (name.length < 2) return sendJson(res, 400, { error: 'Укажите имя (минимум 2 символа)' });
      if (!isValidEmail(email)) return sendJson(res, 400, { error: 'Некорректный email' });
      if (password.length < 6) return sendJson(res, 400, { error: 'Пароль минимум 6 символов' });

      try {
        const user = db.createUser({ name, email, password });
        const token = db.createSession(user.id);
        return sendJson(res, 201, { user, token });
      } catch (e) {
        if (e.message === 'EMAIL_TAKEN') {
          return sendJson(res, 409, { error: 'Этот email уже зарегистрирован' });
        }
        throw e;
      }
    }

    if (method === 'POST' && pathname === '/api/login') {
      const body = await readBody(req);
      const email = String(body.email || '').trim();
      const password = String(body.password || '');
      const user = db.authenticate(email, password);
      if (!user) return sendJson(res, 401, { error: 'Неверный email или пароль' });
      const token = db.createSession(user.id);
      return sendJson(res, 200, { user, token });
    }

    if (method === 'POST' && pathname === '/api/logout') {
      const token = getToken(req);
      db.destroySession(token);
      return sendJson(res, 200, { ok: true });
    }

    if (method === 'GET' && pathname === '/api/me') {
      const user = db.getSessionUser(getToken(req));
      if (!user) return sendJson(res, 401, { error: 'Нужна авторизация' });
      const myReview = db.getUserReview(user.id);
      return sendJson(res, 200, { user, myReview });
    }

    if (method === 'POST' && pathname === '/api/reviews') {
      const user = db.getSessionUser(getToken(req));
      if (!user) return sendJson(res, 401, { error: 'Войдите, чтобы оставить отзыв' });
      const body = await readBody(req);
      try {
        const review = db.upsertReview(user.id, {
          text: body.text,
          rating: body.rating,
          authorName: user.name,
        });
        return sendJson(res, 200, { review, reviews: db.listReviews() });
      } catch (e) {
        if (e.message === 'TEXT_SHORT') {
          return sendJson(res, 400, { error: 'Отзыв слишком короткий (минимум 10 символов)' });
        }
        if (e.message === 'TEXT_LONG') {
          return sendJson(res, 400, { error: 'Отзыв слишком длинный (максимум 1000 символов)' });
        }
        throw e;
      }
    }

    if (method === 'DELETE' && pathname === '/api/reviews/mine') {
      const user = db.getSessionUser(getToken(req));
      if (!user) return sendJson(res, 401, { error: 'Нужна авторизация' });
      db.deleteReview(user.id);
      return sendJson(res, 200, { ok: true, reviews: db.listReviews() });
    }

    return sendJson(res, 404, { error: 'API not found' });
  } catch (e) {
    if (e.message === 'INVALID_JSON') return sendJson(res, 400, { error: 'Некорректный JSON' });
    if (e.message === 'BODY_TOO_LARGE') return sendJson(res, 413, { error: 'Слишком большой запрос' });
    console.error(e);
    return sendJson(res, 500, { error: 'Ошибка сервера' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    return handleApi(req, res, pathname);
  }

  const filePath = resolveFile(pathname);
  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Portfolio + reviews API: http://localhost:${port}`);
  console.log(`  GET  /api/reviews`);
  console.log(`  POST /api/register | /api/login | /api/reviews`);
});
