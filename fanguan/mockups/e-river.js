// 样张 E：开局场景——汴京城外、汴河岸边的路边茶棚。
// 按参考图拆解出来的物件、颜色和比例，一件一件用代码画（见 docs/reference-breakdown.md）。
// 光从右上方来，影子拖向左下；1 格 = 1 米。
import { rng, shade, rgba, bubble, ready } from './common.js';
import { drawSong, bowl, bun, kettle, basket } from './person2.js';

const clean = location.search.includes('clean');
if (clean) document.body.classList.add('clean');

const W = 844, H = 390;
const dpr = window.devicePixelRatio || 1;
const cv = document.getElementById('c');
cv.width = W * dpr;
cv.height = H * dpr;
const ctx = cv.getContext('2d');
ctx.scale(dpr, dpr);

const TW = 72, TH = 36, ZH = 40;
const OX = 300, OY = -28;
const P = (x, y, z = 0) => [OX + ((x - y) * TW) / 2, OY + ((x + y) * TH) / 2 - z * ZH];
const LINE = 'rgba(58,38,20,0.55)';
const R = rng(23);
const HUMAN = 1.65 * ZH; // 人高（像素）

// 取自参考图的颜色
const C = {
  ground: '#c6a875', ground2: '#a78554', groundLight: '#d6be8e',
  grass: '#7f6540', grassLight: '#9c8a55', grassDark: '#4c3c20',
  water: '#898777', waterDeep: '#7a786a', mud: '#9f8b66',
  thatch: '#bf8e5a', thatch2: '#b78653', thatchDark: '#91693f', thatchDeep: '#5b3819',
  wood: '#734929', woodDark: '#583517', woodLight: '#7f613e',
  reedPlume: '#ddc6a2', reedStem: '#857156',
  cloth: '#f2dcb6',
};

function poly(pts, fill, stroke = LINE, lw = 0.7) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}
function box(x, y, z, w, d, h, c, o = {}) {
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const left = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const right = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  // 光从右上来：朝 +x 的面亮，朝 +y 的面暗
  if (!o.noLeft) poly(left, o.left || shade(c, -0.22));
  if (!o.noRight) poly(right, o.right || shade(c, 0.02));
  if (!o.noTop) poly(top, o.top || shade(c, 0.12));
}
function post(x, y, z, h, r = 0.09, c = C.wood) {
  const [bx, by] = P(x, y, z);
  const ht = h * ZH, rw = r * TW * 0.75;
  const g = ctx.createLinearGradient(bx - rw, 0, bx + rw, 0);
  g.addColorStop(0, shade(c, -0.25));
  g.addColorStop(0.6, shade(c, 0.12));
  g.addColorStop(1, shade(c, -0.1));
  ctx.fillStyle = g;
  ctx.fillRect(bx - rw, by - ht, rw * 2, ht);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.strokeRect(bx - rw, by - ht, rw * 2, ht);
}
function onY(y0, fn) {
  ctx.save();
  ctx.transform(TW / (2 * ZH), TH / (2 * ZH), 0, 1, OX - (y0 * TW) / 2, OY + (y0 * TH) / 2);
  fn();
  ctx.restore();
}
function onX(x0, fn) {
  ctx.save();
  ctx.transform(TW / (2 * ZH), -TH / (2 * ZH), 0, 1, OX + (x0 * TW) / 2, OY + (x0 * TH) / 2);
  fn();
  ctx.restore();
}
const m = (v) => v * ZH;

// ---------- 地面 ----------
const shoreX = (y) => 2.9 + 0.55 * Math.sin(0.42 * y + 1.2) + 0.25 * Math.sin(1.3 * y);

function ground() {
  const g = ctx.createLinearGradient(W, 0, 0, H);
  g.addColorStop(0, '#cdb282');
  g.addColorStop(1, '#b8996a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 大块的浓淡
  for (let i = 0; i < 40; i++) {
    const x = R() * W, y = R() * H, r = 30 + R() * 90;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = R() < 0.5 ? C.ground2 : C.groundLight;
    rg.addColorStop(0, rgba(c, 0.36));
    rg.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 官道：沿河的一条土路，两道车辙
  // 路边不是直线：两侧各自随机起伏
  const edge = (base, seed) => {
    const rr = rng(seed);
    const pts = [];
    let off = 0;
    for (let y = -14; y <= 20; y += 0.6) {
      off = off * 0.7 + (rr() - 0.5) * 0.5;
      pts.push([base + off, y]);
    }
    return pts;
  };
  const left = edge(4.75, 3), right = edge(6.45, 9);
  ctx.save();
  ctx.filter = 'blur(5px)';
  poly([...left.map(([x, y]) => P(x, y)), ...right.reverse().map(([x, y]) => P(x, y))], 'rgba(222,200,150,0.5)', null);
  ctx.restore();
  ctx.strokeStyle = 'rgba(120,88,50,0.16)';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([26, 10, 12, 18]);
  for (const rx of [5.25, 5.95]) {
    ctx.beginPath();
    for (let y = -14; y <= 20; y += 0.5) {
      const [sx, sy] = P(rx + Math.sin(y * 0.7) * 0.06, y);
      y === -14 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // 茶棚前被踩实的空地
  ctx.save();
  ctx.filter = 'blur(10px)';
  ctx.fillStyle = 'rgba(214,190,142,0.55)';
  ctx.beginPath();
  const [cx, cy] = P(10.5, 5.5);
  ctx.ellipse(cx, cy, 190, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 草地：不规则的一片（随机游走的软笔触），越往中间越密，边缘是零散草丛
// 草地的底色先画在一张软图层上，最后整体模糊一次（每块单独模糊太慢）
const softLayer = document.createElement('canvas');
softLayer.width = W * dpr;
softLayer.height = H * dpr;
const soft = softLayer.getContext('2d');
soft.scale(dpr, dpr);
function grassPatch(cx, cy, rx, ry, seed, density = 1, phase = 'tufts') {
  const r = rng(seed);
  const pts = [];
  let px = cx, py = cy;
  for (let i = 0; i < 40; i++) {
    px += (r() - 0.5) * rx * 0.5;
    py += (r() - 0.5) * ry * 0.5;
    const dx = (px - cx) / rx, dy = (py - cy) / ry;
    if (dx * dx + dy * dy > 1) {
      px = cx + (px - cx) * 0.5;
      py = cy + (py - cy) * 0.5;
    }
    pts.push([px, py]);
  }
  if (phase === 'soft') {
    for (const [x, y] of pts) {
      soft.fillStyle = rgba(r() < 0.6 ? '#857244' : '#6f6236', 0.24);
      soft.beginPath();
      soft.ellipse(x, y, 10 + r() * 18, 5 + r() * 8, 0, 0, Math.PI * 2);
      soft.fill();
    }
    return;
  }
  const tufts = Math.round(rx * ry * 0.05 * density);
  for (let i = 0; i < tufts; i++) {
    const [bx, by] = pts[(r() * pts.length) | 0];
    const x = bx + (r() - 0.5) * 30, y = by + (r() - 0.5) * 14;
    const blades = 3 + ((r() * 4) | 0);
    for (let k = 0; k < blades; k++) {
      ctx.strokeStyle = rgba(['#5a4a26', '#6f6236', '#8a7a48', '#a59a5c'][(r() * 4) | 0], 0.75);
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(x + k * 1.2, y);
      ctx.quadraticCurveTo(x + k * 1.2 + (r() - 0.5) * 4, y - 3, x + k * 1.2 + (r() - 0.5) * 6, y - 4 - r() * 5);
      ctx.stroke();
    }
  }
  // 野花：一小簇一小簇
  for (let i = 0; i < tufts / 10; i++) {
    const [bx, by] = pts[(r() * pts.length) | 0];
    const col = ['#d8782e', '#efe6cf', '#c95a4a', '#e2b24a', '#e8d27a'][(r() * 5) | 0];
    for (let k = 0; k < 3 + r() * 4; k++) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(bx + (r() - 0.5) * 12, by + (r() - 0.5) * 6 - 3, 1 + r() * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 地面上的碎石、落叶、土粒
function groundDetail() {
  const r = rng(41);
  for (let i = 0; i < 1600; i++) {
    const x = r() * W, y = r() * H;
    ctx.fillStyle = r() < 0.55 ? 'rgba(110,80,45,0.18)' : 'rgba(250,235,200,0.2)';
    ctx.fillRect(x, y, 1 + r() * 2, 1);
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * W, y = r() * H, s = 1.2 + r() * 2.2;
    ctx.fillStyle = shade('#8a7a66', (r() - 0.5) * 0.3);
    ctx.beginPath();
    ctx.ellipse(x, y, s * 1.4, s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,245,220,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + s * 0.3, y - s * 0.3, s * 0.6, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H;
    ctx.fillStyle = rgba(['#c98f4a', '#a8663a', '#d9a35a'][(r() * 3) | 0], 0.7);
    ctx.beginPath();
    ctx.ellipse(x, y, 2.2, 1.1, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function water() {
  // 水面区域：岸线以西（x 更小）
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...P(-20, -14));
    for (let y = -14; y <= 22; y += 0.4) ctx.lineTo(...P(shoreX(y), y));
    ctx.lineTo(...P(-20, 22));
    ctx.closePath();
  };
  // 泥滩过渡
  ctx.save();
  ctx.filter = 'blur(5px)';
  ctx.strokeStyle = rgba('#8a6e48', 0.9);
  ctx.lineWidth = 30;
  ctx.beginPath();
  for (let y = -14; y <= 22; y += 0.4) {
    const [sx, sy] = P(shoreX(y) + 0.15, y);
    y === -14 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
  ctx.save();
  path();
  ctx.clip();
  const g = ctx.createLinearGradient(...P(shoreX(0), 0), ...P(-8, 0));
  g.addColorStop(0, '#8f8c7b');
  g.addColorStop(1, C.waterDeep);
  ctx.fillStyle = g;
  ctx.filter = 'blur(2px)';
  ctx.fillRect(0, 0, W, H);
  ctx.filter = 'none';
  // 靠岸一侧的暗带（岸坡的倒影）
  ctx.save();
  ctx.filter = 'blur(8px)';
  ctx.strokeStyle = 'rgba(70,62,46,0.45)';
  ctx.lineWidth = 26;
  ctx.beginPath();
  for (let y = -14; y <= 22; y += 0.5) {
    const [sx, sy] = P(shoreX(y) - 0.5, y);
    y === -14 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
  // 波纹：一小段一小段的弧
  for (let i = 0; i < 140; i++) {
    const x = R() * W * 0.7, y = R() * H * 0.8;
    ctx.strokeStyle = `rgba(${R() < 0.5 ? '230,220,195' : '80,72,56'},${0.12 + R() * 0.12})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + R() * 10, 1.6, -0.46, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  // 水面的淡淡反光
  for (let i = 0; i < 60; i++) {
    const x = R() * W, y = R() * H;
    ctx.strokeStyle = `rgba(235,225,200,${0.05 + R() * 0.08})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 14 + R() * 30, y - 6 - R() * 8);
    ctx.stroke();
  }
  // 水草
  for (let i = 0; i < 26; i++) {
    const y = -12 + R() * 32;
    const [sx, sy] = P(shoreX(y) - 0.4 - R() * 2.5, y);
    ctx.strokeStyle = 'rgba(70,85,50,0.7)';
    ctx.lineWidth = 0.9;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(sx + k * 1.5, sy);
      ctx.lineTo(sx + k * 1.5 + (R() - 0.5) * 3, sy - 3 - R() * 4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function millet() {
  // 右上角的一片粟田
  const r = rng(31);
  ctx.save();
  ctx.beginPath();
  poly([P(9, -12), P(16, -12), P(16, -3.4), P(9, -3.4)], 'rgba(150,105,55,0.5)', null);
  ctx.clip();
  for (let i = 0; i < 900; i++) {
    const [sx, sy] = P(9 + r() * 7, -12 + r() * 8.6);
    ctx.strokeStyle = rgba('#8a6a3a', 0.8);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 1, sy - 12);
    ctx.stroke();
    ctx.fillStyle = ['#c98f4a', '#d9a35a', '#b8783a'][(r() * 3) | 0];
    ctx.beginPath();
    ctx.ellipse(sx + 2, sy - 13, 1.6, 3.6, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- 影子：统一画在一层上再模糊 ----------
const shadowShapes = [];
const SH = (x, y, z) => P(x - 0.12 * z, y + 0.95 * z, 0); // 光从右上来
function castBox(x, y, w, d, h) {
  shadowShapes.push([P(x, y), P(x + w, y), P(x + w, y + d), SH(x + w, y + d, h), SH(x, y + d, h), SH(x, y, h)]);
}
function drawShadows() {
  const sc = document.createElement('canvas');
  sc.width = W * dpr;
  sc.height = H * dpr;
  const s = sc.getContext('2d');
  s.scale(dpr, dpr);
  s.fillStyle = '#4a2e14';
  for (const pts of shadowShapes) {
    s.beginPath();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    s.fill();
  }
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.filter = 'blur(3px)';
  ctx.drawImage(sc, 0, 0, W, H);
  ctx.restore();
}

// ---------- 河边：栈桥、船、芦苇、柳树 ----------
function dock() {
  const x0 = -2.4, x1 = shoreX(3.0) + 0.5, y0 = 2.4, y1 = 3.6, z = 0.35;
  for (const px of [-2.2, -0.8, 0.6, 2.0]) {
    for (const py of [y0 + 0.05, y1 - 0.05]) {
      const [bx, by] = P(px, py, -0.3);
      ctx.fillStyle = C.woodDark;
      ctx.fillRect(bx - 2, by - (z + 0.5) * ZH, 4, (z + 0.5) * ZH);
    }
  }
  // 水里的倒影
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.filter = 'blur(2px)';
  poly([P(x0, y0, -0.1), P(x1, y0, -0.1), P(x1, y1 + 0.6, -0.1), P(x0, y1 + 0.6, -0.1)], '#3a2a1a', null);
  ctx.restore();
  box(x0, y0, z - 0.06, x1 - x0, y1 - y0, 0.06, C.woodLight, { top: '#8a6a44' });
  ctx.strokeStyle = 'rgba(50,30,14,0.55)';
  ctx.lineWidth = 0.7;
  for (let x = x0 + 0.25; x < x1; x += 0.25) {
    ctx.beginPath();
    ctx.moveTo(...P(x, y0, z));
    ctx.lineTo(...P(x + (R() - 0.5) * 0.04, y1, z));
    ctx.stroke();
  }
  for (const px of [-2.2, 2.0]) post(px, y1, z, 0.55, 0.06, C.woodDark);
}

function boat(x0, x1, y0, y1) {
  const ym = (y0 + y1) / 2, z = 0.05, hz = 0.55;
  // 倒影
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.filter = 'blur(3px)';
  ctx.fillStyle = '#2a1e12';
  ctx.beginPath();
  ctx.ellipse(...P((x0 + x1) / 2, ym + 0.5, 0), 70, 14, 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 船身：两头尖、中间宽
  const rim = [];
  const hull = [];
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const x = x0 + (x1 - x0) * t, half = Math.sin(Math.PI * t) ** 0.7 * (y1 - y0) / 2;
    rim.push([x, ym - half]);
    hull.push([x, ym + half]);
  }
  const side = [...hull.map(([x, y]) => P(x, y, z + hz)), ...hull.slice().reverse().map(([x, y]) => P(x, y - 0.1, z))];
  poly(side, '#6e4e30');
  const deck = [...rim.map(([x, y]) => P(x, y, z + hz)), ...hull.slice().reverse().map(([x, y]) => P(x, y, z + hz))];
  poly(deck, '#8c6a44');
  // 船板
  ctx.strokeStyle = 'rgba(50,30,14,0.5)';
  for (let t = 0.2; t < 0.85; t += 0.13) {
    const x = x0 + (x1 - x0) * t, half = Math.sin(Math.PI * t) ** 0.7 * (y1 - y0) / 2;
    ctx.beginPath();
    ctx.moveTo(...P(x, ym - half, z + hz));
    ctx.lineTo(...P(x, ym + half, z + hz));
    ctx.stroke();
  }
  // 竹篷
  const cx0 = x0 + (x1 - x0) * 0.32, cx1 = x0 + (x1 - x0) * 0.62;
  const arch = (x) => {
    const pts = [];
    for (let a = 0; a <= Math.PI + 0.001; a += Math.PI / 10) pts.push(P(x, ym + Math.cos(a) * 0.55, z + hz + Math.sin(a) * 0.65));
    return pts;
  };
  const a0 = arch(cx0), a1 = arch(cx1);
  poly([...a1, ...a0.slice().reverse()], '#bf9c62');
  ctx.strokeStyle = 'rgba(90,60,25,0.35)';
  ctx.lineWidth = 0.6;
  for (let i = 1; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(...a0[i]);
    ctx.lineTo(...a1[i]);
    ctx.stroke();
  }
  poly(a1.concat([P(cx1, ym - 0.55, z + hz)]), '#a9844e');
  // 撑篙
  ctx.strokeStyle = '#5a3e22';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(...P(x1 - 0.3, ym, z + hz));
  ctx.lineTo(...P(x1 + 1.4, ym - 0.8, 3.2));
  ctx.stroke();
}

function reeds(x, y, n, seed) {
  const r = rng(seed);
  const [bx, by] = P(x, y, 0);
  for (let i = 0; i < n; i++) {
    const sx = bx + (r() - 0.5) * 34, sy = by + (r() - 0.5) * 14;
    const hgt = 30 + r() * 34, lean = (r() - 0.3) * 16;
    ctx.strokeStyle = rgba(r() < 0.5 ? C.reedStem : '#6a5a3c', 0.9);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + lean * 0.3, sy - hgt * 0.6, sx + lean, sy - hgt);
    ctx.stroke();
    // 叶
    ctx.beginPath();
    ctx.moveTo(sx, sy - hgt * 0.3);
    ctx.quadraticCurveTo(sx - 8, sy - hgt * 0.45, sx - 12 - r() * 6, sy - hgt * 0.3);
    ctx.stroke();
    if (r() < 0.75) {
      ctx.fillStyle = rgba(C.reedPlume, 0.95);
      ctx.save();
      ctx.translate(sx + lean, sy - hgt);
      ctx.rotate(-0.4 + lean * 0.03);
      ctx.beginPath();
      ctx.ellipse(0, -5, 2.4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(150,120,80,0.6)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}

// 老柳树：粗矮的树桩上冒出许多细枝，柳条成片垂下（《清明上河图》里汴河岸边就是这种柳）
function willow(x, y) {
  const r = rng(77);
  const [bx, by] = P(x, y, 0);
  shadowShapes.push((() => {
    const pts = [];
    for (let a = 0; a < Math.PI * 2; a += 0.3) pts.push(SH(x + Math.cos(a) * 2.0, y + Math.sin(a) * 2.0, 4.0));
    return pts;
  })());
  const cx = bx - 6, cy = by - 128; // 树冠中心
  // 树冠的体积：一团模糊的暗绿
  ctx.save();
  ctx.filter = 'blur(10px)';
  ctx.fillStyle = 'rgba(70,80,40,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 20, 78, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 后层柳条（暗）
  const strand = (sx, sy, len, col, w, dash) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx + 2, sy + len * 0.3, sx + 5 + r() * 3, sy + len * 0.6, sx + 3 + r() * 4, sy + len);
    ctx.stroke();
  };
  const inDome = () => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    return [cx + Math.cos(a) * d * 78, cy + Math.sin(a) * d * 34 - 6, Math.abs(Math.cos(a) * d)];
  };
  for (let i = 0; i < 170; i++) {
    const [sx, sy, edge] = inDome();
    strand(sx, sy, 34 + edge * 50 + r() * 40, rgba(r() < 0.5 ? '#4a5428' : '#5c6830', 0.75), 1.4, [4, 1.5]);
  }
  // 树干：粗、扭，向河边歪，顶上分成几个短杈
  const trunk = [[bx, by], [bx - 8, by - 34], [bx + 10, by - 62], [bx - 2, by - 92]];
  for (const [w, c] of [[17, '#2e2216'], [13, '#5a4430']]) {
    ctx.strokeStyle = c;
    ctx.lineCap = 'round';
    ctx.lineWidth = w;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(...trunk[0]);
    ctx.bezierCurveTo(...trunk[1], ...trunk[2], ...trunk[3]);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(200,170,120,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + 4, by - 6);
  ctx.bezierCurveTo(bx - 2, by - 34, bx + 14, by - 60, bx + 4, by - 88);
  ctx.stroke();
  for (const [dx, dy, w] of [[-26, -36, 6], [-4, -44, 7], [22, -34, 6], [36, -18, 4], [-40, -14, 4]]) {
    ctx.strokeStyle = '#4a3828';
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(bx - 2, by - 90);
    ctx.quadraticCurveTo(bx - 2 + dx * 0.4, by - 90 + dy * 0.9, bx - 2 + dx, by - 90 + dy);
    ctx.stroke();
  }
  // 细枝
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(70,52,34,0.8)';
  for (let i = 0; i < 26; i++) {
    const [sx, sy] = inDome();
    ctx.beginPath();
    ctx.moveTo(bx - 2 + (r() - 0.5) * 40, by - 110 - r() * 20);
    ctx.quadraticCurveTo((sx + bx) / 2, sy - 20, sx, sy);
    ctx.stroke();
  }
  // 前层柳条：右上方受光，偏黄绿
  for (let i = 0; i < 230; i++) {
    const [sx, sy, edge] = inDome();
    const lit = (sx - cx) / 78 - (sy - cy) / 60;
    const col = lit > 0.4 ? '#b5b872' : lit > -0.1 ? '#8d9850' : '#6d7a3e';
    strand(sx, sy, 26 + edge * 46 + r() * 36, rgba(col, 0.85), 1.1, [3, 1.2]);
  }
  ctx.setLineDash([]);
}

// ---------- 茶摊：布棚 + 单坡小草棚 + 油纸伞（照参考图里路边摊的做法） ----------
const F = 0;

function stove(x, y) {
  const w = 0.95, d = 0.75, h = 0.7;
  castBox(x, y, w, d, h);
  box(x, y, F, w, d, h, '#a07250', { top: '#6e5038' });
  onY(y + d, () => {
    const gx = m(x + 0.35), gy = -m(F + 0.26);
    const g = ctx.createRadialGradient(gx, gy, 1, gx, gy, 12);
    g.addColorStop(0, '#ffe08a');
    g.addColorStop(0.45, '#e8742a');
    g.addColorStop(1, '#3a1a0c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy + 3, 7, Math.PI, 0);
    ctx.lineTo(gx + 7, gy + 9);
    ctx.lineTo(gx - 7, gy + 9);
    ctx.fill();
  });
  const [kx, ky] = P(x + 0.3, y + 0.38, F + h);
  kettle(ctx, kx, ky - 5, 1.7, 0);
  for (let i = 0; i < 3; i++) {
    const [sx, sy] = P(x + 0.7, y + 0.38, F + h + i * 0.13);
    ctx.fillStyle = shade('#c4a06a', -i * 0.04);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 11, 5.5, 0, 0, Math.PI);
    ctx.lineTo(sx - 11, sy - 5);
    ctx.ellipse(sx, sy - 5, 11, 5.5, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const [tx, ty] = P(x + 0.7, y + 0.38, F + h + 0.39);
  ctx.fillStyle = '#d8b884';
  ctx.beginPath();
  ctx.ellipse(tx, ty, 11, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const r = rng(4);
  for (const [sx, sy] of [[kx + 4, ky - 16], [tx, ty - 4]]) {
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(255,250,240,${0.26 * (1 - i / 8)})`;
      ctx.beginPath();
      ctx.arc(sx + Math.sin(i * 1.2) * 4 + r() * 2, sy - i * 7, 4 + i * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function waterVat(x, y, r = 0.34, h = 0.7) {
  const [cx, cy] = P(x, y, F);
  const rx = r * TW * 0.72, ry = r * TH * 0.72, hh = h * ZH;
  const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, '#2e2a24');
  g.addColorStop(0.65, '#5a5246');
  g.addColorStop(1, '#3a342c');
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.8, ry * 0.8, 0, 0, Math.PI);
  ctx.quadraticCurveTo(cx - rx * 1.15, cy - hh * 0.5, cx - rx, cy - hh);
  ctx.ellipse(cx, cy - hh, rx, ry, 0, Math.PI, 0, true);
  ctx.quadraticCurveTo(cx + rx * 1.15, cy - hh * 0.5, cx + rx * 0.8, cy);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7d8a84';
  ctx.beginPath();
  ctx.ellipse(cx, cy - hh, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9a7a4a';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy - hh - 1, 5, 2, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// 竹竿：带竹节
function bamboo(x, y, z0, z1, w = 2.6, c = '#8a7046') {
  const [bx, by] = P(x, y, z0);
  const [, ty] = P(x, y, z1);
  const g = ctx.createLinearGradient(bx - w, 0, bx + w, 0);
  g.addColorStop(0, shade(c, -0.25));
  g.addColorStop(0.6, shade(c, 0.15));
  g.addColorStop(1, shade(c, -0.1));
  ctx.fillStyle = g;
  ctx.fillRect(bx - w / 2, ty, w, by - ty);
  ctx.fillStyle = 'rgba(60,40,20,0.45)';
  for (let yy = by - 14; yy > ty + 4; yy -= 16) ctx.fillRect(bx - w / 2, yy, w, 1);
}

// 单坡小草棚：高边在 x = a，低边在 x = b（朝镜头），横跨 y = c..d
function leanTo({ a, b, c, d, hi, lo }) {
  const r = rng(8);
  for (const [px, py, h] of [[a, c, hi], [a, d, hi], [b, c, lo], [b, d, lo]]) post(px, py, 0, h, 0.07, C.wood);
  shadowShapes.push([SH(a, c, hi), SH(b, c, lo), SH(b, d, lo), SH(a, d, hi)]);
  const o = 0.3; // 出檐
  const A = a - 0.1, B = b + o, C0 = c - o, D = d + o;
  const zAt = (x) => hi + ((lo - hi) * (x - a)) / (b - a);
  const pts = [P(A, C0, zAt(A)), P(A, D, zAt(A)), P(B, D, zAt(B)), P(B, C0, zAt(B))];
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  const g = ctx.createLinearGradient(...P(A, (C0 + D) / 2, zAt(A)), ...P(B, (C0 + D) / 2, zAt(B)));
  g.addColorStop(0, '#c99a64');
  g.addColorStop(1, '#a87a46');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 900; i++) {
    const x = A + r() * (B - A), y = C0 + r() * (D - C0);
    const [sx, sy] = P(x, y, zAt(x));
    const len = 3 + r() * 7;
    ctx.strokeStyle = rgba([C.thatch, C.thatch2, '#d4aa72', C.thatchDark][(r() * 4) | 0], 0.5 + r() * 0.35);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 0.894 * len, sy + 0.447 * len);
    ctx.stroke();
  }
  ctx.restore();
  poly(pts, null);
  // 檐口草茬、侧边草层厚度
  const e0 = P(B, C0, zAt(B)), e1 = P(B, D, zAt(B));
  poly([e0, e1, [e1[0], e1[1] + 5], [e0[0], e0[1] + 5]], C.thatchDark);
  for (let i = 0; i < 90; i++) {
    const t = r();
    const sx = e0[0] + (e1[0] - e0[0]) * t, sy = e0[1] + (e1[1] - e0[1]) * t + 4;
    ctx.strokeStyle = rgba(r() < 0.5 ? '#a87c48' : '#7a5530', 0.85);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (r() - 0.5) * 2, sy + 2 + r() * 4);
    ctx.stroke();
  }
  const s0 = P(A, D, zAt(A)), s1 = P(B, D, zAt(B));
  poly([s0, s1, [s1[0], s1[1] + 5], [s0[0], s0[1] + 5]], '#6f4f2c');
  // 压草的竹竿
  for (const x of [A + 0.15, (A + B) / 2]) {
    ctx.strokeStyle = '#6a4e2a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...P(x, C0, zAt(x) + 0.04));
    ctx.lineTo(...P(x, D, zAt(x) + 0.04));
    ctx.stroke();
    ctx.strokeStyle = '#c8a670';
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }
}

// 布棚：几根竹骨从后（高）斜到前（低），布在竹骨之间往下垂，前沿是一串弧
function clothAwning({ a, b, c, d, hi, lo, n, sag }) {
  const zAt = (x) => hi + ((lo - hi) * (x - a)) / (b - a);
  const ys = Array.from({ length: n + 1 }, (_, k) => c + ((d - c) * k) / n);
  for (const [px, py, h] of [[a, c, hi], [a, d, hi], [a, (c + d) / 2, hi]]) bamboo(px, py, 0, h, 3);
  shadowShapes.push([SH(a, c, hi), SH(b, c, lo), SH(b, d, lo), SH(a, d, hi)]);
  const A = a - 0.15, B = b + 0.2;
  for (let k = 0; k < n; k++) {
    const y0 = ys[k], y1 = ys[k + 1], ym = (y0 + y1) / 2;
    ctx.beginPath();
    ctx.moveTo(...P(A, y0, zAt(A)));
    ctx.lineTo(...P(B, y0, zAt(B)));
    ctx.quadraticCurveTo(...P(B, ym, zAt(B) - sag * 2), ...P(B, y1, zAt(B)));
    ctx.lineTo(...P(A, y1, zAt(A)));
    ctx.quadraticCurveTo(...P(A, ym, zAt(A) - sag * 1.2), ...P(A, y0, zAt(A)));
    ctx.closePath();
    // 靠前一根竹骨那半边背光，靠后一根受光
    const g = ctx.createLinearGradient(...P((A + B) / 2, y0, zAt((A + B) / 2)), ...P((A + B) / 2, y1, zAt((A + B) / 2)));
    g.addColorStop(0, '#ecd6b0');
    g.addColorStop(0.5, '#d9be94');
    g.addColorStop(1, '#b89a72');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,64,36,0.5)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    // 前沿下摆
    ctx.strokeStyle = '#a88a62';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(...P(B, y0, zAt(B)));
    ctx.quadraticCurveTo(...P(B, ym, zAt(B) - sag * 2), ...P(B, y1, zAt(B)));
    ctx.stroke();
  }
  // 补丁
  {
    const k = 1, y0 = ys[k] + 0.12, y1 = ys[k + 1] - 0.1;
    const xa = A + (B - A) * 0.18, xb = A + (B - A) * 0.48;
    const pts = [P(xa, y0, zAt(xa) - 0.03), P(xb, y0, zAt(xb) - 0.03), P(xb, y1, zAt(xb) - 0.03), P(xa, y1, zAt(xa) - 0.03)];
    poly(pts, '#d9bf96', null);
    ctx.setLineDash([2, 2]);
    poly(pts, null, 'rgba(110,80,46,0.7)', 0.7);
    ctx.setLineDash([]);
  }
  // 竹骨
  for (const y of ys) {
    ctx.strokeStyle = '#7a6040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(...P(A - 0.1, y, zAt(A - 0.1)));
    ctx.lineTo(...P(B + 0.1, y, zAt(B + 0.1)));
    ctx.stroke();
  }
  // 前面的竹竿和拉绳（画在布的前面）
  for (const py of [c, d, (c + d) / 2]) bamboo(b, py, 0, lo, 3);
  ctx.strokeStyle = 'rgba(200,180,140,0.9)';
  ctx.lineWidth = 0.8;
  for (const [py, dy] of [[c, -0.7], [d, 0.7]]) {
    ctx.beginPath();
    ctx.moveTo(...P(b, py, lo));
    ctx.lineTo(...P(b + 1.0, py + dy, 0));
    ctx.stroke();
    const [kx, ky] = P(b + 1.0, py + dy, 0);
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(kx - 1, ky - 4, 2, 5);
  }
}

// 大油纸伞：插在桌边遮阳
function parasol(x, y, h = 2.3, rad = 1.25) {
  const pts = [];
  for (let a = 0; a < Math.PI * 2; a += 0.35) pts.push(SH(x + Math.cos(a) * rad, y + Math.sin(a) * rad, h));
  shadowShapes.push(pts);
  const [bx, by] = P(x, y, 0);
  const [ax, ay] = P(x, y, h + 0.4);
  ctx.strokeStyle = '#4a3020';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(ax, ay + 10);
  ctx.stroke();
  const rim = [];
  const N = 20;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    rim.push(P(x + Math.cos(a) * rad, y + Math.sin(a) * rad, h));
  }
  // 下摆
  for (let i = 0; i < N; i++) {
    const p0 = rim[i], p1 = rim[(i + 1) % N];
    if (p0[1] < ay + 6 && p1[1] < ay + 6) continue;
    ctx.fillStyle = '#9a6a3e';
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    ctx.lineTo(p1[0], p1[1] + 6);
    ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 10, p0[0], p0[1] + 6);
    ctx.fill();
  }
  for (let i = 0; i < N; i++) {
    const p0 = rim[i], p1 = rim[(i + 1) % N];
    const lit = Math.cos((i / N) * Math.PI * 2 + 0.8);
    ctx.fillStyle = shade(i % 2 ? '#e3c08a' : '#d8b27a', lit * 0.12);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(...p0);
    ctx.lineTo(...p1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,76,40,0.55)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(...p0);
    ctx.stroke();
  }
  ctx.fillStyle = '#6a4a2a';
  ctx.beginPath();
  ctx.ellipse(ax, ay, 4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

// 竹篱笆：分段画，每段按自己的深度排序
function fenceSeg(fx, y0, y1, seed) {
  const r = rng(seed);
  for (let y = y0; y < y1; y += 0.14) bamboo(fx, y, 0, 0.8 + r() * 0.3, 2.4, '#8f7a4c');
  for (const z of [0.32, 0.68]) {
    ctx.strokeStyle = '#6e5a36';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(...P(fx + 0.04, y0, z));
    ctx.lineTo(...P(fx + 0.04, y1, z));
    ctx.stroke();
  }
}

// 酒坛：红布封口，贴红纸
function wineJar(x, y, s = 1) {
  const [cx, cy] = P(x, y, 0);
  ctx.fillStyle = 'rgba(60,38,18,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx - 5, cy + 1, 13 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(cx - 11 * s, 0, cx + 11 * s, 0);
  g.addColorStop(0, '#4a2a18');
  g.addColorStop(0.6, '#7a4a2a');
  g.addColorStop(1, '#4e2e1a');
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(cx - 7 * s, cy);
  ctx.quadraticCurveTo(cx - 14 * s, cy - 14 * s, cx - 6 * s, cy - 24 * s);
  ctx.lineTo(cx + 6 * s, cy - 24 * s);
  ctx.quadraticCurveTo(cx + 14 * s, cy - 14 * s, cx + 7 * s, cy);
  ctx.quadraticCurveTo(cx, cy + 3 * s, cx - 7 * s, cy);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b23a26';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 25 * s, 8 * s, 3.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 8 * s, cy - 25 * s);
  ctx.quadraticCurveTo(cx - 9 * s, cy - 19 * s, cx - 6 * s, cy - 18 * s);
  ctx.lineTo(cx + 6 * s, cy - 18 * s);
  ctx.quadraticCurveTo(cx + 9 * s, cy - 19 * s, cx + 8 * s, cy - 25 * s);
  ctx.fill();
  ctx.fillStyle = '#c8452e';
  ctx.fillRect(cx - 4 * s, cy - 14 * s, 8 * s, 8 * s);
  ctx.fillStyle = '#f2d27a';
  ctx.font = `600 ${7 * s}px "Noto Serif SC", serif`;
  ctx.textAlign = 'center';
  ctx.fillText('酒', cx, cy - 7.6 * s);
}

// 矮架子：放茶碗、茶壶、蒸笼
function lowShelf(x, y, w, d) {
  const h = 0.62;
  for (const [dx, dy] of [[0.03, 0.03], [w - 0.08, 0.03], [0.03, d - 0.08], [w - 0.08, d - 0.08]]) box(x + dx, y + dy, 0, 0.05, 0.05, h - 0.05, C.woodDark);
  box(x, y, h - 0.05, w, d, 0.05, '#8a6440', { top: '#a07a4c' });
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = P(x + w / 2, y + 0.2 + i * 0.13, h);
    bowl(ctx, sx, sy - 2 - i, 1.6);
  }
  const [px, py] = P(x + w / 2, y + d - 0.3, h);
  kettle(ctx, px, py - 5, 1.5, 0);
}

// 菜地：几垄白菜，一架葫芦
function veggiePlot(x0, y0, x1, y1) {
  const r = rng(55);
  ctx.save();
  ctx.filter = 'blur(2px)';
  poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], '#7a5a36', null);
  ctx.restore();
  for (let y = y0 + 0.4; y < y1 - 0.2; y += 0.7) {
    ctx.strokeStyle = 'rgba(60,40,20,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(...P(x0 + 0.1, y + 0.3));
    ctx.lineTo(...P(x1 - 0.1, y + 0.3));
    ctx.stroke();
    for (let x = x0 + 0.3; x < x1 - 0.2; x += 0.42) {
      const [sx, sy] = P(x + (r() - 0.5) * 0.08, y);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        ctx.fillStyle = shade(k % 2 ? '#6f8a3c' : '#87a24a', (r() - 0.5) * 0.2);
        ctx.beginPath();
        ctx.ellipse(sx + Math.cos(a) * 4, sy - 4 + Math.sin(a) * 2, 4.5, 2.6, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#c8d48a';
      ctx.beginPath();
      ctx.ellipse(sx, sy - 5, 3.2, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function trellis(x, y0, y1) {
  for (let y = y0; y <= y1; y += 0.6) bamboo(x, y, 0, 1.5, 2.2, '#8f7a4c');
  ctx.strokeStyle = '#6e5a36';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(...P(x, y0, 1.45));
  ctx.lineTo(...P(x, y1, 1.45));
  ctx.stroke();
  const r = rng(61);
  for (let i = 0; i < 70; i++) {
    const y = y0 + r() * (y1 - y0), z = 0.3 + r() * 1.25;
    const [sx, sy] = P(x, y, z);
    ctx.fillStyle = rgba(['#5d7a34', '#6f8a3c', '#4e6a2c'][(r() * 3) | 0], 0.9);
    ctx.beginPath();
    ctx.ellipse(sx + (r() - 0.5) * 6, sy, 4, 3, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [y, z] of [[y0 + 0.5, 1.0], [y0 + 1.3, 0.8], [y1 - 0.4, 1.1]]) {
    const [sx, sy] = P(x + 0.05, y, z);
    ctx.fillStyle = '#c9b46a';
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, 3.2, 4.2, 0, 0, Math.PI * 2);
    ctx.ellipse(sx, sy - 2, 2.2, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function table(cx, cy, items = []) {
  const s = 0.45, h = 0.72;
  for (const [dx, dy] of [[-s + 0.03, -s + 0.03], [s - 0.09, -s + 0.03], [-s + 0.03, s - 0.09], [s - 0.09, s - 0.09]]) box(cx + dx, cy + dy, 0, 0.06, 0.06, h - 0.05, C.woodDark);
  box(cx - s, cy - s, h - 0.05, s * 2, s * 2, 0.05, '#7c5a38', { top: '#9a7448' });
  castBox(cx - s, cy - s, s * 2, s * 2, h);
  for (const [kind, dx, dy] of items) {
    const [sx, sy] = P(cx + dx, cy + dy, h);
    if (kind === 'bowl') bowl(ctx, sx, sy - 1, 1.5);
    else if (kind === 'bun') {
      ctx.fillStyle = '#e9e2d0';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 8, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      bun(ctx, sx - 2.5, sy, 1.3);
      bun(ctx, sx + 2.5, sy - 0.5, 1.3);
    } else if (kind === 'pot') kettle(ctx, sx, sy - 5, 1.3, 0);
  }
}
const bench = (cx, y) => {
  box(cx - 0.55, y - 0.12, 0.38, 1.1, 0.24, 0.06, '#86603a', { top: '#a07448' });
  for (const lx of [-0.48, 0.42]) box(cx + lx, y - 0.08, 0, 0.06, 0.16, 0.38, C.woodDark);
};

function flag(x, y) {
  const [bx, by] = P(x, y, 0);
  shadowShapes.push([P(x - 0.05, y), P(x + 0.05, y), SH(x + 0.05, y, 3.8), SH(x - 0.05, y, 3.8)]);
  ctx.strokeStyle = '#4a3020';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by - 3.9 * ZH);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx, by - 3.75 * ZH);
  ctx.lineTo(bx + 26, by - 3.75 * ZH - 10);
  ctx.stroke();
  const fx = bx + 4, fy = by - 3.75 * ZH - 2;
  ctx.fillStyle = '#efe2c4';
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + 21, fy - 8);
  ctx.quadraticCurveTo(fx + 25, fy + 26, fx + 22, fy + 52);
  ctx.lineTo(fx + 12, fy + 46);
  ctx.lineTo(fx + 2, fy + 58);
  ctx.quadraticCurveTo(fx + 4, fy + 28, fx, fy);
  ctx.fill();
  ctx.strokeStyle = '#a8342a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#2a1a10';
  ctx.font = '21px "Ma Shan Zheng", serif';
  ctx.textAlign = 'center';
  ctx.fillText('茶', fx + 12, fy + 28);
}

function woodpile(x, y) {
  const r = rng(12);
  castBox(x, y, 0.9, 0.5, 0.6);
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 6 - row; i++) {
      const [sx, sy] = P(x + 0.1 + i * 0.15 + row * 0.07, y + 0.5, 0.08 + row * 0.15);
      ctx.fillStyle = shade('#8a6a44', (r() - 0.5) * 0.2);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3.2, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c8a878';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function chicken(x, y, c = '#8a5a34', flip = 1) {
  const [sx, sy] = P(x, y, 0);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(flip, 1);
  ctx.fillStyle = 'rgba(70,45,22,0.25)';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(0, -5, 5.5, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.lineTo(-9, -11);
  ctx.lineTo(-4, -8);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4.5, -9, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b8402a';
  ctx.fillRect(4, -12.5, 2, 1.8);
  ctx.fillStyle = '#d9a23a';
  ctx.beginPath();
  ctx.moveTo(7, -9);
  ctx.lineTo(9, -8.4);
  ctx.lineTo(7, -8);
  ctx.fill();
  ctx.strokeStyle = '#a07030';
  ctx.beginPath();
  ctx.moveTo(-1, -1.5);
  ctx.lineTo(-1, 0);
  ctx.moveTo(1.5, -1.5);
  ctx.lineTo(1.5, 0);
  ctx.stroke();
  ctx.restore();
}

function sack(x, y, z = 0, s = 1) {
  const [sx, sy] = P(x, y, z);
  ctx.fillStyle = 'rgba(60,38,18,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx - 4, sy + 1, 13 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(sx - 10 * s, 0, sx + 10 * s, 0);
  g.addColorStop(0, '#d9c49c');
  g.addColorStop(1, '#a88e64');
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(sx - 10 * s, sy);
  ctx.quadraticCurveTo(sx - 12 * s, sy - 14 * s, sx - 5 * s, sy - 20 * s);
  ctx.lineTo(sx - 2 * s, sy - 24 * s);
  ctx.lineTo(sx + 3 * s, sy - 24 * s);
  ctx.lineTo(sx + 5 * s, sy - 20 * s);
  ctx.quadraticCurveTo(sx + 12 * s, sy - 14 * s, sx + 10 * s, sy);
  ctx.quadraticCurveTo(sx, sy + 3 * s, sx - 10 * s, sy);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#6a5030';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sx - 4 * s, sy - 20 * s);
  ctx.lineTo(sx + 4 * s, sy - 20 * s);
  ctx.stroke();
}

function basketStack(x, y) {
  const [sx, sy] = P(x, y, 0);
  for (let i = 0; i < 3; i++) basket(ctx, sx + (i % 2) * 4, sy - i * 7, 0.7, i === 2 ? '#d9c7a0' : '#b08a52');
}

function bookBox(x, y) {
  const [sx, sy] = P(x, y);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = 'rgba(60,38,18,0.3)';
  ctx.beginPath();
  ctx.ellipse(-6, 1, 12, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, '#8a6a42');
  g.addColorStop(1, '#5e4428');
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.fillRect(-7, -24, 14, 24);
  ctx.strokeRect(-7, -24, 14, 24);
  ctx.strokeStyle = 'rgba(40,24,10,0.5)';
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-7, -24 + i * 6);
    ctx.lineTo(7, -24 + i * 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#d8c49a';
  ctx.beginPath();
  ctx.moveTo(-11, -24);
  ctx.quadraticCurveTo(0, -33, 11, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 风炉：小泥炉上温着一把壶
function brazier(x, y) {
  const [sx, sy] = P(x, y, 0);
  ctx.fillStyle = 'rgba(60,38,18,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx - 5, sy + 1, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(sx - 9, 0, sx + 9, 0);
  g.addColorStop(0, '#8a5e3c');
  g.addColorStop(1, '#a87a52');
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(sx - 8, sy);
  ctx.lineTo(sx - 9, sy - 18);
  ctx.lineTo(sx + 9, sy - 18);
  ctx.lineTo(sx + 8, sy);
  ctx.quadraticCurveTo(sx, sy + 3, sx - 8, sy);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5a3a24';
  ctx.beginPath();
  ctx.ellipse(sx, sy - 18, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const fg = ctx.createRadialGradient(sx - 2, sy - 7, 1, sx - 2, sy - 7, 7);
  fg.addColorStop(0, '#ffd27a');
  fg.addColorStop(1, '#a8401a');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(sx - 2, sy - 6, 4, Math.PI, 0);
  ctx.lineTo(sx + 2, sy - 3);
  ctx.lineTo(sx - 6, sy - 3);
  ctx.fill();
  kettle(ctx, sx, sy - 25, 1.5, 0);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(255,250,240,${0.22 * (1 - i / 6)})`;
    ctx.beginPath();
    ctx.arc(sx + 14 + i * 1.5, sy - 34 - i * 6, 3 + i * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function person(x, y, o, z = 0) {
  const [sx, sy] = P(x, y, z);
  drawSong(ctx, sx, sy, HUMAN, o);
}

// ---------- 场景 ----------
ground();
groundDetail();
millet();
const GRASS = [
  [4.0, -6, 70, 26, 1], [3.9, 2.0, 46, 20, 2], [3.9, 7.0, 60, 22, 3], [9.5, 11.5, 120, 40, 4],
  [14.0, 6.0, 90, 30, 5], [11.5, -2.5, 60, 24, 6], [7.4, -2.5, 60, 22, 7], [3.8, 11.5, 70, 26, 8], [15.2, 3.2, 50, 20, 9],
];
for (const [x, y, rx, ry, seed] of GRASS) grassPatch(...P(x, y), rx, ry, seed, 1, 'soft');
ctx.save();
ctx.filter = 'blur(6px)';
ctx.drawImage(softLayer, 0, 0, W, H);
ctx.restore();
for (const [x, y, rx, ry, seed] of GRASS) grassPatch(...P(x, y), rx, ry, seed);
water();
veggiePlot(11.8, -1.8, 14.6, 1.4);

const items = [];
const add = (d, fn) => items.push({ d, fn });

add(-1, dock);
add(1.5, () => boat(-3.0, 0.8, 4.05, 5.25));
for (const [y, n, seed] of [[-9, 10, 1], [-5.5, 14, 2], [-1.6, 12, 3], [1.2, 8, 8], [7.0, 12, 5], [9.6, 9, 4], [12.6, 14, 6], [14.6, 10, 7]]) {
  add(shoreX(y) + y, () => reeds(shoreX(y) + 0.15, y, n, seed));
}
add(3.7 + 11.0, () => willow(3.7, 11.0));
add(7.1 + 7.2 + 0.1, () => flag(7.1, 7.2));
add(11.6 + 1.6, () => trellis(11.55, -1.6, 1.4));

// 茶摊
const AW = { a: 8.0, b: 10.6, c: 3.2, d: 6.4, hi: 2.5, lo: 2.05, n: 5, sag: 0.12 };
const LT = { a: 8.0, b: 9.6, c: 1.0, d: 2.75, hi: 2.25, lo: 1.95 };
for (let y = 0.8; y < 6.9; y += 1.0) add(7.6 + y, ((yy) => () => fenceSeg(7.6, yy, Math.min(yy + 1.0, 6.9), yy * 10))(y));
add(8.3 + 1.3, () => stove(8.3, 1.3));
add(9.15 + 1.25, () => waterVat(9.15, 1.25));
add(8.2 + 0.4, () => woodpile(8.1, 0.15));
add(9.9 + 0.7, () => sack(9.9, 0.7, 0));
add(10.2 + 0.95, () => sack(10.25, 0.95, 0, 0.85));
add(9.85 + 2.1, () => person(9.85, 2.1, { garb: 'dress', top: '#7f8f92', bottom: '#d5ad89', hat: 'lady', pose: 'tend', facing: -1, dots: '#b98a6a' }));
add(LT.b + LT.d, () => leanTo(LT));
add(8.25 + 4.0, () => lowShelf(8.2, 3.9, 0.5, 1.5));
add(8.0 + 6.75, () => wineJar(8.05, 6.75));
add(8.3 + 7.05, () => wineJar(8.35, 7.1, 0.9));
add(7.85 + 7.15, () => wineJar(7.85, 7.2, 0.8));

const T = [
  { x: 10.0, y: 4.25, items: [['bowl', -0.15, -0.1], ['bun', 0.15, 0.12]] },
  { x: 9.4, y: 5.75, items: [['bowl', 0.1, -0.15], ['bowl', -0.15, 0.1], ['pot', 0.15, 0.15]] },
  { x: 12.1, y: 7.7, items: [['bowl', -0.1, -0.1], ['bun', 0.12, 0.12]] },
  { x: 7.6, y: 9.0, items: [['bowl', -0.12, -0.1], ['bowl', 0.15, 0.05]] },
];
for (const t of T) {
  add(t.x + t.y - 0.62, () => bench(t.x, t.y - 0.62));
  add(t.x + t.y, () => table(t.x, t.y, t.items));
  add(t.x + t.y + 0.62, () => bench(t.x, t.y + 0.62));
}
// 布棚下：老农吃炊饼，货郎背对镜头
add(10.0 + 3.63 + 0.1, () => person(9.95, 3.85, { garb: 'short', top: '#62563c', bottom: '#3e3528', hat: 'straw', pose: 'sit', facing: -1, leggings: '#c1ab8b' }));
add(10.0 + 4.87 + 0.1, () => person(10.1, 4.65, { garb: 'short', top: '#7b6a4c', bottom: '#4a3e2c', hat: 'jin', pose: 'sit', back: true, facing: 1 }));
add(9.4 + 5.13 + 0.1, () => person(9.3, 5.35, { garb: 'long', top: '#5f6a6a', hat: 'futou', pose: 'drink', seated: true, facing: -1 }));
add(AW.b + AW.d + 0.05, () => clothAwning(AW));
// 油纸伞下：行脚客背对镜头，店家倒茶，风炉温着水
add(12.1 + 8.32 + 0.1, () => person(12.1, 8.1, { garb: 'long', top: '#57422e', hat: 'futou', pose: 'sit', back: true, facing: 1 }));
add(12.95 + 7.7 + 0.2, () => person(12.95, 7.7, { garb: 'short', top: '#6f6a55', bottom: '#3e3a2e', hat: 'jin', pose: 'pour', facing: -1, apron: '#c9b48c' }));
add(13.3 + 6.6, () => brazier(13.3, 6.6));
// 路边那桌：赶考书生，书箱放在脚边
add(6.95 + 8.4, () => bookBox(6.95, 8.45));
add(7.6 + 9.0 + 0.8, () => parasol(7.25, 8.6, 2.25, 1.05));
add(7.6 + 8.38 + 0.1, () => person(7.6, 8.6, { garb: 'long', top: '#837e6b', hat: 'scholar', pose: 'drink', seated: true, facing: -1 }));
// 歇脚的挑夫
add(7.4 + 11.4, () => {
  const [sx, sy] = P(7.3, 11.6);
  basket(ctx, sx - 22, sy - 4, 0.68, '#6f8a3c');
  basket(ctx, sx + 18, sy + 6, 0.68, '#c9883a');
  ctx.strokeStyle = '#6e4e2c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - 34, sy - 6);
  ctx.lineTo(sx + 30, sy + 8);
  ctx.stroke();
});
add(7.9 + 11.0, () => person(7.9, 11.0, { garb: 'short', top: '#443f36', bottom: '#5a4a38', hat: 'jin', pose: 'squat', facing: -1, leggings: '#bc9e70' }));
// 船夫在栈桥上系缆
add(1.2 + 3.2, () => person(1.1, 3.0, { garb: 'short', top: '#6c6449', bottom: '#3a3226', hat: 'straw', pose: 'tie', facing: -1 }, 0.35));
// 官道上的行人
add(5.6 + 8.6, () => person(5.6, 8.6, { garb: 'short', top: '#7b6a4c', bottom: '#4a3e2c', hat: 'straw', pose: 'pole', back: true, facing: 1, leggings: '#c1ab8b' }));
add(5.3 + -0.6, () => person(5.3, -0.6, { garb: 'beizi', top: '#996141', bottom: '#d5ad89', hat: 'lady', pose: 'walk', facing: -1, flower: '#e8d27a' }));
// 鸡
add(11.2 + 3.2, () => chicken(11.2, 3.2));
add(11.8 + 2.8, () => chicken(11.8, 2.8, '#e6dcc5', -1));
add(11.0 + 3.8, () => chicken(11.0, 3.8, '#5a3a22'));

drawShadows();
items.sort((a, b) => a.d - b.d).forEach((it) => it.fn());

// 光：右上方的斜阳和一点空气感
{
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const g = ctx.createLinearGradient(W, 0, 0, H);
  g.addColorStop(0, 'rgba(255,215,140,0.85)');
  g.addColorStop(1, 'rgba(120,70,30,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // 四角压暗
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7);
  v.addColorStop(0, 'rgba(70,45,20,0)');
  v.addColorStop(1, 'rgba(70,45,20,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

if (!clean) {
  const [ax, ay] = P(12.95, 7.7);
  bubble(ctx, ax, ay - HUMAN - 6, '客官，喝碗热茶歇歇脚～', { dx: 40 });
  const [bx, by] = P(7.9, 11.0);
  bubble(ctx, bx, by - HUMAN * 0.66 - 4, '听说上游又要征夫修堤了…', { dx: 10 });
  const [cx, cy] = P(9.4, 5.75, 0.72);
  ctx.save();
  ctx.fillStyle = 'rgba(42,26,14,0.82)';
  ctx.beginPath();
  ctx.roundRect(cx - 70, cy - 4, 50, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#e2b13e';
  ctx.beginPath();
  ctx.arc(cx - 59, cy + 6, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3a14';
  ctx.fillRect(cx - 61, cy + 4, 4, 4);
  ctx.fillStyle = '#f6d98a';
  ctx.font = '600 13px "Noto Serif SC", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('+12', cx - 49, cy + 6.5);
  ctx.restore();
}

ready();
