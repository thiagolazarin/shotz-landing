// Servidor local: gera o site, serve public/ em http://localhost:3000
// e refaz o build sempre que algo em src/ mudar (é só recarregar a página).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const PORT = Number(process.env.PORT) || 3000;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

build();
let timer;
watch(join(root, 'src'), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => { try { build(); } catch (e) { console.error('✖ erro no build:', e.message); } }, 150);
});

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(pub, path));
    if (!file.startsWith(pub)) { res.writeHead(403); return res.end(); }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}).listen(PORT, () => {
  console.log(`\n  SHOTZ rodando:\n  → http://localhost:${PORT}        (versão editorial)\n  → http://localhost:${PORT}/lata   (versão lata)\n\n  Edite arquivos em src/ e recarregue a página. Ctrl+C para parar.\n`);
});
