// 把样张页面按手机横屏尺寸截图到 out/。
// 用法：node render.mjs [a b c d]   （不写参数就全部重画）
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('.', import.meta.url).pathname;
const pages = {
  a: 'a-iso.html',
  b: 'b-pixel.html',
  c: 'c-3d.html',
  d: 'd-side.html',
};
const want = process.argv.slice(2);
const list = Object.entries(pages).filter(([k]) => !want.length || want.includes(k));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
await mkdir(join(root, 'out'), { recursive: true });
let failed = false;
for (const [key, file] of list) {
  // 横屏手机：844×390（iPhone 14 一类的逻辑尺寸），2 倍像素
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + file);
  try {
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  } catch {
    errors.push('timeout waiting for __ready');
  }
  const out = join(root, 'out', file.replace('.html', '.png'));
  await page.screenshot({ path: out });
  console.log(errors.length ? `✗ ${file}\n  ${errors.join('\n  ')}` : `✓ ${file} → out/${file.replace('.html', '.png')}`);
  if (errors.length) failed = true;
  await page.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
