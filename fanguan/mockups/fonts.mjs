// 扫描样张里用到的汉字，从 Google Fonts 下载只含这些字的子集（几十 KB）。
// 字体均为 SIL Open Font License，可随仓库分发。
// 用法：node fonts.mjs   （样张里加了新字以后重跑）
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const dir = new URL('.', import.meta.url).pathname;
const files = readdirSync(dir).filter((f) => /\.(html|js|css)$/.test(f));
const chars = new Set();
for (const f of files) {
  for (const ch of readFileSync(dir + f, 'utf8')) {
    if (/[ -⁯☀-➿　-〿一-鿿＀-￯]/.test(ch)) chars.add(ch);
  }
}
const text = [...chars].sort().join('') + '0123456789,.+-:';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const fonts = [
  ['Ma+Shan+Zheng', 'mashanzheng.woff2'],
  ['Noto+Serif+SC:wght@600', 'notoserifsc-600.woff2'],
];
mkdirSync(dir + 'fonts', { recursive: true });
for (const [family, out] of fonts) {
  const css = execFileSync('curl', ['-sS', '-m', '30', '-A', UA,
    `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`]).toString();
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((x) => x[1]);
  if (urls.length !== 1) throw new Error(`${family}: expected 1 font url, got ${urls.length}`);
  const buf = execFileSync('curl', ['-sS', '-m', '60', '-A', UA, urls[0]], { maxBuffer: 1 << 26 });
  writeFileSync(dir + 'fonts/' + out, buf);
  console.log(`${out}: ${chars.size} 个字, ${(buf.length / 1024).toFixed(1)} KB`);
}
