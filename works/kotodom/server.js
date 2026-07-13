const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function createServer() {
  return http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';

    const filePath = path.join(__dirname, url);

    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      res.end(data);
    });
  });
}

function tryListen(port) {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(err);
      } else {
        console.error(err);
        process.exit(1);
      }
    });
    server.listen(port, () => resolve({ server, port }));
  });
}

async function start() {
  const preferred = Number(process.env.PORT) || 8080;

  for (let port = preferred; port < preferred + 10; port++) {
    try {
      const { port: actual } = await tryListen(port);
      console.log(`Котодом запущен: http://localhost:${actual}`);
      if (actual !== preferred) {
        console.log(`(порт ${preferred} занят, используется ${actual})`);
      }
      return;
    } catch (err) {
      if (err.code !== 'EADDRINUSE') throw err;
    }
  }

  console.error('Не удалось найти свободный порт (8080–8089).');
  process.exit(1);
}

start();