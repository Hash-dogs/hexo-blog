#!/usr/bin/env node
/**
 * 常驻静态预览服务
 *
 * 把 public/ 挂载到 /hexo-blog/ 前缀下（对应 _config.yml 的 root: /hexo-blog/）。
 * 只读取磁盘文件，所以 `npx hexo generate` 写完盘后立刻生效，无需重启。
 *
 * 用法：
 *   node .claude/skills/frontend/scripts/preview-server.js [port]
 *
 * 默认端口 5000，默认根目录为仓库下的 public/。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || process.env.PREVIEW_PORT || 5000);
const PREFIX = '/hexo-blog';
const ROOT = path.resolve(__dirname, '../../../../public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);

  // 不带前缀的请求统一跳到带前缀的地址
  if (urlPath === '/' || urlPath === '') {
    res.writeHead(302, { Location: `${PREFIX}/` });
    return res.end();
  }
  if (!urlPath.startsWith(PREFIX)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`404: 只服务 ${PREFIX}/ 下的路径（对应 hexo root 配置）`);
  }

  let rel = urlPath.slice(PREFIX.length);
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';

  const file = path.resolve(ROOT, '.' + rel);
  // 防目录穿越
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403');
  }

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(`404: ${rel}`);
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      // 必须禁用缓存：重新 generate 后浏览器要立刻拿到新产物
      'Cache-Control': 'no-store, must-revalidate',
    });
    res.end(buf);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用。可能预览服务已在运行——先用 curl 试一下，别急着再起一个。`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`preview ready: http://127.0.0.1:${PORT}${PREFIX}/`);
  console.log(`serving: ${ROOT}`);
});
