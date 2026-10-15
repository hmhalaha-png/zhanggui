// 样张 A：2.5D 等距古风。墙体切开看室内，下午的暖光。
import { rng, shade, rgba, paperOverlay, drawPerson, bubble, ready } from './common.js';

const W = 844, H = 390;
const dpr = window.devicePixelRatio || 1;
const cv = document.getElementById('c');
cv.width = W * dpr;
cv.height = H * dpr;
const ctx = cv.getContext('2d');
ctx.scale(dpr, dpr);

// 等距投影：1 格 = 1 米
const TW = 46, TH = 23, ZH = 26;
const OX = 372, OY = 128;
const F = 0.22; // 店内地板高度
const P = (x, y, z = 0) => [OX + ((x - y) * TW) / 2, OY + ((x + y) * TH) / 2 - z * ZH];
const EDGE = 'rgba(52,32,16,0.42)';
const R = rng(11);

function poly(pts, fill, stroke = EDGE, lw = 0.6) {
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
  if (!o.noLeft) poly(left, o.left || shade(c, -0.1), o.stroke);
  if (!o.noRight) poly(right, o.right || shade(c, -0.28), o.stroke);
  if (!o.noTop) poly(top, o.top || shade(c, 0.1), o.stroke);
}

// 竖直圆柱（坛子、蒸笼、水缸）
function cyl(x, y, z, r, h, c, topC) {
  const [cx, cy] = P(x, y, z);
  const rx = r * TW * 0.72, ry = r * TH * 0.72, hh = h * ZH;
  const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  g.addColorStop(0, shade(c, 0.12));
  g.addColorStop(0.45, c);
  g.addColorStop(1, shade(c, -0.4));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(cx - rx, cy - hh);
  ctx.ellipse(cx, cy - hh, rx, ry, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.fillStyle = topC || shade(c, 0.15);
  ctx.beginPath();
  ctx.ellipse(cx, cy - hh, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// 在 y = y0 的墙面上画（局部坐标：横向 = x 米 × ZH，纵向向下 = -z 米 × ZH）
function onY(y0, fn) {
  ctx.save();
  ctx.transform(TW / (2 * ZH), TH / (2 * ZH), 0, 1, OX - (y0 * TW) / 2, OY + (y0 * TH) / 2);
  fn();
  ctx.restore();
}
// 在 x = x0 的墙面上画（局部横向 = -y 米 × ZH，从左往右读）
function onX(x0, fn) {
  ctx.save();
  ctx.transform(TW / (2 * ZH), -TH / (2 * ZH), 0, 1, OX + (x0 * TW) / 2, OY + (x0 * TH) / 2);
  fn();
  ctx.restore();
}
const m = (v) => v * ZH;

function lattice(x, y, w, h, frame, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = frame;
  ctx.lineWidth = 1.2;
  const n = 5;
  for (let i = 1; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / n, y);
    ctx.lineTo(x + (w * i) / n, y + h);
    ctx.stroke();
  }
  for (let j = 1; j < 6; j++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h * j) / 6);
    ctx.lineTo(x + w, y + (h * j) / 6);
    ctx.stroke();
  }
  ctx.lineWidth = 2.4;
  ctx.strokeRect(x, y, w, h);
}

// ---------- 地面 ----------
function ground() {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#dcc092');
  g.addColorStop(1, '#c9a676');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 街道：店前和店右各一条略浅的路
  poly([P(-12, 7.7), P(20, 7.7), P(20, 10.4), P(-12, 10.4)], 'rgba(240,222,186,0.45)', null);
  poly([P(10.7, -12), P(13.2, -12), P(13.2, 12), P(10.7, 12)], 'rgba(240,222,186,0.4)', null);
  ctx.strokeStyle = 'rgba(120,85,45,0.18)';
  ctx.lineWidth = 1.4;
  for (const yy of [8.6, 9.3]) {
    ctx.beginPath();
    ctx.moveTo(...P(-12, yy));
    ctx.lineTo(...P(20, yy));
    ctx.stroke();
  }
  // 土粒、碎石
  for (let i = 0; i < 900; i++) {
    const x = R() * W, y = R() * H;
    ctx.fillStyle = R() < 0.5 ? 'rgba(120,85,45,0.16)' : 'rgba(255,245,220,0.22)';
    ctx.fillRect(x, y, 1 + R() * 1.6, 1 + R() * 1.2);
  }
}

// ---------- 远处邻居 ----------
function roofGable(x, y, w, d, wallH, rise, over, tile) {
  // 沿 x 方向的人字顶，带一点起翘
  const z0 = wallH, z1 = wallH + rise, ym = y + d / 2;
  const bx0 = x - over, bx1 = x + w + over;
  const curve = (a, b, lift) => {
    ctx.moveTo(...a);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + lift;
    ctx.quadraticCurveTo(mx, my, b[0], b[1]);
  };
  // 后坡
  ctx.beginPath();
  curve(P(bx0, y - over, z0 + 0.25), P(bx1, y - over, z0 + 0.25), 5);
  ctx.lineTo(...P(bx1, ym, z1));
  ctx.lineTo(...P(bx0, ym, z1));
  ctx.closePath();
  ctx.fillStyle = shade(tile, 0.12);
  ctx.fill();
  // 前坡
  ctx.beginPath();
  ctx.moveTo(...P(bx0, ym, z1));
  ctx.lineTo(...P(bx1, ym, z1));
  ctx.lineTo(...P(bx1, y + d + over, z0 + 0.25));
  const a = P(bx1, y + d + over, z0 + 0.25), b = P(bx0, y + d + over, z0 + 0.25);
  ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 5, b[0], b[1]);
  ctx.closePath();
  ctx.fillStyle = tile;
  ctx.fill();
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // 瓦垄
  ctx.strokeStyle = 'rgba(25,25,28,0.45)';
  ctx.lineWidth = 0.9;
  for (let t = bx0 + 0.18; t < bx1; t += 0.32) {
    ctx.beginPath();
    ctx.moveTo(...P(t, ym, z1));
    ctx.lineTo(...P(t, y + d + over, z0 + 0.25));
    ctx.stroke();
  }
  // 山墙
  poly([P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, ym, z1 - 0.15)], shade('#d9c9a8', -0.18));
  // 正脊
  ctx.strokeStyle = '#2b2a2c';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(...P(bx0, ym, z1 + 0.05));
  ctx.lineTo(...P(bx1, ym, z1 + 0.05));
  ctx.stroke();
  // 脊端起翘
  for (const xx of [bx0, bx1]) {
    const [sx, sy] = P(xx, ym, z1 + 0.05);
    ctx.fillStyle = '#2b2a2c';
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy + 1);
    ctx.quadraticCurveTo(sx, sy - 12, sx + 5, sy - 10);
    ctx.lineTo(sx + 3, sy + 1);
    ctx.fill();
  }
}

function neighbor(x, y, w, d, h) {
  box(x, y, 0, w, d, 0.25, '#b9a888');
  box(x, y, 0.25, w, d, h - 0.25, '#ddcfb2', { top: '#cbb995' });
  // 正面木构：柱子和格窗
  onY(y + d, () => {
    for (let t = x; t <= x + w + 0.01; t += w / 3) {
      ctx.fillStyle = '#5b3a24';
      ctx.fillRect(m(t) - 3, -m(h), 6, m(h - 0.25));
    }
    for (let k = 0; k < 3; k++) {
      lattice(m(x + (w / 3) * k + 0.35), -m(h - 0.5), m(w / 3 - 0.7), m(1.3), '#5b3a24', '#efe3c7');
    }
    ctx.fillStyle = '#6e4a2e';
    ctx.fillRect(m(x), -m(1.0), m(w), m(0.75));
  });
  roofGable(x, y, w, d, h, 1.7, 0.55, '#4b4f55');
}

// ---------- 树 ----------
function tree(x, y, c, seed, size = 1) {
  const r = rng(seed);
  const [bx, by] = P(x, y, 0);
  // 树影
  ctx.fillStyle = 'rgba(80,50,20,0.18)';
  ctx.beginPath();
  ctx.ellipse(bx + 22 * size, by + 4, 40 * size, 13 * size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a3d27';
  ctx.lineCap = 'round';
  ctx.lineWidth = 6 * size;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx - 4, by - 40 * size, bx + 2, by - 66 * size);
  ctx.stroke();
  ctx.lineWidth = 3 * size;
  ctx.beginPath();
  ctx.moveTo(bx - 1, by - 38 * size);
  ctx.lineTo(bx - 20 * size, by - 62 * size);
  ctx.moveTo(bx + 1, by - 46 * size);
  ctx.lineTo(bx + 22 * size, by - 70 * size);
  ctx.stroke();
  const cy = by - 78 * size;
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const px = bx + Math.cos(a) * d * 38 * size, py = cy + Math.sin(a) * d * 28 * size;
    const shadeAmt = (py - cy) / (28 * size) * 0.25 + (px - bx) / (38 * size) * 0.12;
    ctx.fillStyle = shade(c, -0.05 - shadeAmt * 0.9 + r() * 0.1);
    ctx.beginPath();
    ctx.arc(px, py, (6 + r() * 7) * size, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    ctx.fillStyle = rgba('#fff4cf', 0.35);
    ctx.beginPath();
    ctx.arc(bx - 10 * size + Math.cos(a) * d * 22 * size, cy - 8 * size + Math.sin(a) * d * 16 * size, 2 + r() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function blossom(x, y) {
  const r = rng(5);
  const [bx, by] = P(x, y, 0);
  ctx.strokeStyle = '#4e3426';
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + 6, by - 30, bx - 4, by - 52);
  ctx.moveTo(bx + 2, by - 30);
  ctx.quadraticCurveTo(bx + 18, by - 40, bx + 26, by - 58);
  ctx.moveTo(bx - 2, by - 40);
  ctx.lineTo(bx - 24, by - 54);
  ctx.stroke();
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    ctx.fillStyle = r() < 0.6 ? 'rgba(232,150,150,0.85)' : 'rgba(250,236,232,0.95)';
    ctx.beginPath();
    ctx.arc(bx + Math.cos(a) * d * 34, by - 56 + Math.sin(a) * d * 22, 2 + r() * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- 饭馆 ----------
function restaurantShell() {
  box(-0.3, -0.3, 0, 10.6, 7.6, F, '#c2b08f', { top: '#d8c7a5' });
  // 木地板
  poly([P(0, 0, F), P(10, 0, F), P(10, 7, F), P(0, 7, F)], '#a5764b', null);
  ctx.strokeStyle = 'rgba(70,40,18,0.35)';
  ctx.lineWidth = 0.7;
  for (let y = 0.32; y < 7; y += 0.32) {
    ctx.beginPath();
    ctx.moveTo(...P(0, y, F));
    ctx.lineTo(...P(10, y, F));
    ctx.stroke();
    for (let x = R() * 1.5; x < 10; x += 1.4 + R()) {
      ctx.beginPath();
      ctx.moveTo(...P(x, y - 0.32, F));
      ctx.lineTo(...P(x, y, F));
      ctx.stroke();
    }
  }
  for (let i = 0; i < 260; i++) {
    const [sx, sy] = P(R() * 10, R() * 7, F);
    ctx.fillStyle = 'rgba(255,230,190,0.08)';
    ctx.fillRect(sx, sy, 6, 1);
  }
  // 左墙投在地板上的阴影
  poly([P(0, 0, F), P(1.3, 0, F), P(1.3, 7, F), P(0, 7, F)], 'rgba(60,35,15,0.16)', null);

  // 后墙 y = 0
  box(0, -0.2, F, 10, 0.2, 3.0, '#e8dbbd', { top: '#8b6a48', noRight: true });
  // 左墙 x = 0
  box(-0.2, -0.2, F, 0.2, 7.2, 3.0, '#e8dbbd', { top: '#8b6a48', noLeft: true });
  // 后墙内侧
  onY(0, () => {
    ctx.fillStyle = '#7a5232';
    ctx.fillRect(0, -m(F + 0.95), m(10), m(0.95));
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, -m(F + 0.95), m(10), 2);
    for (const t of [0, 2.5, 5, 7.5, 10]) {
      ctx.fillStyle = '#5b3a24';
      ctx.fillRect(m(t) - 4, -m(F + 3), 8, m(3));
    }
    ctx.fillStyle = '#5b3a24';
    ctx.fillRect(0, -m(F + 3), m(10), 7);
    lattice(m(0.7), -m(F + 2.45), m(1.2), m(1.2), '#5b3a24', '#f4e9cf');
    lattice(m(3.0), -m(F + 2.45), m(1.4), m(1.2), '#5b3a24', '#f4e9cf');
    // 山水挂轴
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(m(5.55), -m(F + 2.6), m(0.7), m(1.5));
    ctx.strokeStyle = '#6a4a2e';
    ctx.lineWidth = 2;
    ctx.strokeRect(m(5.55), -m(F + 2.6), m(0.7), m(1.5));
    ctx.fillStyle = 'rgba(70,80,80,0.45)';
    ctx.beginPath();
    ctx.moveTo(m(5.6), -m(F + 1.35));
    ctx.lineTo(m(5.8), -m(F + 2.0));
    ctx.lineTo(m(5.95), -m(F + 1.7));
    ctx.lineTo(m(6.1), -m(F + 2.2));
    ctx.lineTo(m(6.2), -m(F + 1.35));
    ctx.fill();
    // 厨房那段墙熏黑一些，挂碗架
    const g = ctx.createLinearGradient(0, -m(F + 3), 0, -m(F + 1));
    g.addColorStop(0, 'rgba(60,40,25,0.45)');
    g.addColorStop(1, 'rgba(60,40,25,0)');
    ctx.fillStyle = g;
    ctx.fillRect(m(6.6), -m(F + 3), m(3.4), m(2));
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(m(6.9), -m(F + 2.0), m(1.6), 4);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#e9e2d0' : '#7d9aa0';
      ctx.beginPath();
      ctx.ellipse(m(7.05 + i * 0.26), -m(F + 2.0) - 4, 5, 4, 0, Math.PI, 0);
      ctx.fill();
    }
  });
  // 左墙内侧：菜牌 + 酒架
  onX(0, () => {
    ctx.fillStyle = '#7a5232';
    ctx.fillRect(-m(7), -m(F + 0.95), m(7), m(0.95));
    for (const t of [0, 3.5, 7]) {
      ctx.fillStyle = '#5b3a24';
      ctx.fillRect(-m(t) - 4, -m(F + 3), 8, m(3));
    }
    ctx.fillStyle = '#5b3a24';
    ctx.fillRect(-m(7), -m(F + 3), m(7), 7);
    const dishes = ['红烧肉', '糖醋鱼', '东坡肘', '桂花糕', '阳春面', '女儿红'];
    dishes.forEach((d, i) => {
      const x = -m(4.55) + i * m(0.37);
      ctx.fillStyle = i === 5 ? '#a8342a' : '#3b2618';
      ctx.fillRect(x, -m(F + 2.75), m(0.3), m(1.05));
      ctx.fillStyle = '#ecd9a8';
      ctx.font = '600 7.5px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      [...d].forEach((ch, k) => ctx.fillText(ch, x + m(0.15), -m(F + 2.75) + 10 + k * 8.5));
    });
    // 酒架
    ctx.fillStyle = '#5b3a24';
    ctx.fillRect(-m(6.7), -m(F + 1.85), m(1.7), 4);
    ctx.fillRect(-m(6.7), -m(F + 2.55), m(1.7), 4);
    for (let i = 0; i < 5; i++) {
      for (const lv of [1.85, 2.55]) {
        const cx = -m(6.55) + i * m(0.34);
        ctx.fillStyle = '#6a3a22';
        ctx.beginPath();
        ctx.ellipse(cx, -m(F + lv) - 7, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c23a2c';
        ctx.fillRect(cx - 3, -m(F + lv) - 9, 6, 5);
      }
    }
  });
}

function table(t) {
  const { x, y } = t;
  const c = '#7a4a2a';
  // 桌腿
  for (const [dx, dy] of [[0.05, 0.05], [0.97, 0.05], [0.05, 0.97], [0.97, 0.97]]) {
    box(x - 0.55 + dx, y - 0.55 + dy, F, 0.08, 0.08, 0.72, c);
  }
  box(x - 0.55, y - 0.55, F + 0.72, 1.1, 1.1, 0.08, c, { top: '#8f5a33' });
  // 菜
  for (const [dx, dy, food] of t.dishes || []) {
    const [sx, sy] = P(x + dx, y + dy, F + 0.8);
    ctx.fillStyle = '#f4efe2';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = food;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 0.8, 4, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (t.jug) {
    const [sx, sy] = P(x + 0.25, y - 0.2, F + 0.8);
    ctx.fillStyle = '#5e7f86';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 5, 3.4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sx - 1.2, sy - 12, 2.4, 3);
  }
}
const bench = (x, y, horiz = true) =>
  horiz ? box(x - 0.55, y - 0.13, F, 1.1, 0.26, 0.45, '#8a5a34') : box(x - 0.13, y - 0.55, F, 0.26, 1.1, 0.45, '#8a5a34');

function seat(x, y, opt) {
  const [sx, sy] = P(x, y, F + 0.45);
  drawPerson(ctx, sx, sy + 3, 43, { ...opt, pose: opt.pose || 'sit', noShadow: true });
}
function stand(x, y, opt) {
  const [sx, sy] = P(x, y, opt.z ?? F);
  drawPerson(ctx, sx, sy, opt.s || 43, opt);
}

function lantern(x, y, z) {
  const [sx, sy] = P(x, y, z);
  const g = ctx.createRadialGradient(sx, sy + 8, 2, sx, sy + 8, 34);
  g.addColorStop(0, 'rgba(255,190,90,0.45)');
  g.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(sx - 34, sy - 26, 68, 68);
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx, sy - 6);
  ctx.lineTo(sx, sy);
  ctx.stroke();
  const lg = ctx.createRadialGradient(sx - 2, sy + 6, 1, sx, sy + 8, 9);
  lg.addColorStop(0, '#ffcf7a');
  lg.addColorStop(0.5, '#e0502e');
  lg.addColorStop(1, '#9c2a1c');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 8, 7, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(sx - 4, sy - 1, 8, 2.2);
  ctx.fillRect(sx - 4, sy + 15.5, 8, 2.2);
  ctx.strokeStyle = '#e9b54a';
  ctx.beginPath();
  ctx.moveTo(sx, sy + 17.5);
  ctx.lineTo(sx, sy + 25);
  ctx.stroke();
}

function column(x, y) {
  box(x - 0.17, y - 0.17, F, 0.34, 0.34, 0.22, '#b7a98c');
  box(x - 0.12, y - 0.12, F + 0.22, 0.24, 0.24, 2.8, '#8e3326', { top: '#6b2a20' });
}

function railingY(y, x0, x1) {
  for (let x = x0 + 0.15; x < x1; x += 0.32) box(x, y - 0.04, F, 0.06, 0.06, 0.55, '#6e4628');
  box(x0, y - 0.07, F + 0.55, x1 - x0, 0.12, 0.08, '#6e4628');
  box(x0, y - 0.07, F, x1 - x0, 0.12, 0.1, '#5b3a24');
}
function railingX(x, y0, y1) {
  for (let y = y0 + 0.15; y < y1; y += 0.32) box(x - 0.04, y, F, 0.06, 0.06, 0.55, '#6e4628');
  box(x - 0.07, y0, F + 0.55, 0.12, y1 - y0, 0.08, '#6e4628');
  box(x - 0.07, y0, F, 0.12, y1 - y0, 0.1, '#5b3a24');
}

function kitchen() {
  // 灶台
  box(7.0, 0.15, F, 2.7, 1.0, 0.85, '#9a5a3c', { top: '#b98a66' });
  for (const wx of [7.65, 8.95]) {
    const [sx, sy] = P(wx, 0.65, F + 0.85);
    ctx.fillStyle = '#2b2622';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 11, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = wx < 8 ? '#b5532b' : '#d9c37a';
    ctx.beginPath();
    ctx.ellipse(sx + 1, sy, 6.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 灶口火光
  onY(1.15, () => {
    for (const fx of [7.65, 8.95]) {
      const gx = m(fx), gy = -m(F + 0.3);
      const g = ctx.createRadialGradient(gx, gy, 1, gx, gy, 12);
      g.addColorStop(0, '#ffe08a');
      g.addColorStop(0.5, '#ef7a2c');
      g.addColorStop(1, '#4a1e10');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(gx, gy + 4, 8, Math.PI, 0);
      ctx.lineTo(gx + 8, gy + 8);
      ctx.lineTo(gx - 8, gy + 8);
      ctx.fill();
    }
  });
  // 烟囱
  box(9.35, 0.0, F + 0.85, 0.35, 0.35, 2.15, '#8a5038');
  // 水缸
  cyl(6.85, 0.55, F, 0.32, 0.7, '#4c4038', '#5d8c94');
  // 隔墙（传菜台）
  box(7.4, 2.5, F, 2.6, 0.18, 1.0, '#e2d4b6', { top: '#8b6a48' });
  box(6.5, 0.0, F, 0.15, 1.3, 1.0, '#e2d4b6', { top: '#8b6a48' });
  // 案板
  box(9.05, 1.5, F, 0.8, 0.6, 0.78, '#8a6440', { top: '#c8a678' });
  const [kx, ky] = P(9.45, 1.8, F + 0.78);
  ctx.fillStyle = '#6f9a3a';
  ctx.beginPath();
  ctx.arc(kx - 4, ky - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  for (let i = 0; i < 4; i++) ctx.fillRect(kx + 2 + i * 2, ky - 1 + (i % 2), 1.6, 3);
}

function steam() {
  const r = rng(3);
  for (const wx of [7.65, 8.95]) {
    const [sx, sy] = P(wx, 0.65, F + 0.85);
    for (let i = 0; i < 9; i++) {
      const t = i / 9;
      ctx.fillStyle = `rgba(255,252,245,${0.32 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(sx + Math.sin(i * 1.3) * 5 + r() * 3, sy - 6 - i * 6, 5 + i * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function counter() {
  box(1.0, 2.2, F, 0.7, 2.3, 1.05, '#6b3d22', { top: '#4a2a17' });
  onX(1.7, () => {
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = 'rgba(233,201,122,0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-m(4.4) + i * m(0.55) + 3, -m(F + 0.9), m(0.45), m(0.65));
    }
  });
  // 算盘、账本
  const [ax, ay] = P(1.35, 3.0, F + 1.05);
  ctx.fillStyle = '#3b2213';
  ctx.fillRect(ax - 9, ay - 4, 18, 7);
  ctx.fillStyle = '#c9a24a';
  for (let i = 0; i < 6; i++) ctx.fillRect(ax - 7 + i * 2.6, ay - 2 + (i % 2), 1.6, 2);
  const [bx, by] = P(1.35, 3.8, F + 1.05);
  ctx.fillStyle = '#eadcb8';
  ctx.fillRect(bx - 6, by - 4, 12, 6);
}

function jars() {
  for (const [x, y, s] of [[0.42, 5.2, 1], [0.42, 5.9, 1], [0.42, 6.6, 1], [1.05, 6.45, 0.85]]) {
    cyl(x, y, F, 0.27 * s, 0.62 * s, '#6a3a22', '#d1452f');
    const [sx, sy] = P(x, y, F + 0.38 * s);
    ctx.fillStyle = '#c23a2c';
    ctx.fillRect(sx - 4, sy - 4, 8, 8);
    ctx.fillStyle = '#f3d27a';
    ctx.font = '600 7px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('酒', sx, sy + 2.6);
  }
}

function plant(x, y) {
  cyl(x, y, F, 0.22, 0.35, '#5e7f86');
  const [sx, sy] = P(x, y, F + 0.35);
  const r = rng(x * 100 + y);
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = shade('#5d8a45', -r() * 0.3);
    ctx.beginPath();
    ctx.ellipse(sx + (r() - 0.5) * 16, sy - 6 - r() * 16, 3.5, 2.2, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function entrance() {
  box(3.1, 7.0, 0, 2.2, 0.55, F, '#c9b896');
  box(3.1, 7.55, 0, 2.2, 0.3, F / 2, '#c9b896');
  column(3.0, 7.0);
  column(5.4, 7.0);
  box(2.85, 6.94, F + 2.55, 2.8, 0.14, 0.24, '#5b3a24');
  // 匾额
  onY(7.08, () => {
    const x0 = m(3.35), y0 = -m(F + 2.53), w = m(1.7), h = m(0.5);
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(x0 - 2, y0 - h, w + 4, h + 2);
    ctx.fillStyle = '#3b2618';
    ctx.fillRect(x0, y0 - h + 2, w, h - 2);
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x0 + 2, y0 - h + 4, w - 4, h - 6);
    ctx.fillStyle = '#ecc865';
    ctx.font = '13px "Ma Shan Zheng", serif';
    ctx.textAlign = 'center';
    ctx.fillText('福来饭馆', x0 + w / 2, y0 - 4.5);
  });
}

function wineFlag(x, y) {
  const [bx, by] = P(x, y, 0);
  ctx.strokeStyle = '#4a3020';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx, by - 112);
  ctx.lineTo(bx - 30, by - 104);
  ctx.stroke();
  ctx.fillStyle = 'rgba(70,45,20,0.18)';
  ctx.beginPath();
  ctx.ellipse(bx + 8, by + 2, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const fx = bx - 29, fy = by - 104;
  ctx.fillStyle = '#f2e8d2';
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + 24, fy - 3);
  ctx.lineTo(fx + 26, fy + 50);
  ctx.lineTo(fx + 15, fy + 44);
  ctx.lineTo(fx + 4, fy + 52);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a8342a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#2a1a10';
  ctx.font = '22px "Ma Shan Zheng", serif';
  ctx.textAlign = 'center';
  ctx.fillText('酒', fx + 13.5, fy + 28);
}

function stall(x, y) {
  box(x - 0.6, y - 0.35, 0, 1.2, 0.7, 0.75, '#8a6440', { top: '#a9845a' });
  for (const [dx, dy] of [[-0.3, -0.05], [0.05, 0.05], [0.35, -0.08]]) {
    cyl(x + dx, y + dy, 0.75, 0.18, 0.22, '#c8a26a');
    cyl(x + dx, y + dy, 0.97, 0.18, 0.12, '#c8a26a', '#efe6d2');
  }
}
function umbrella(x, y, z, c) {
  const [px, py] = P(x, y, 0);
  const [sx, sy] = P(x, y, z);
  ctx.strokeStyle = '#4a3020';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(sx, sy);
  ctx.stroke();
  ctx.fillStyle = shade(c, -0.25);
  ctx.beginPath();
  ctx.ellipse(sx, sy + 3, 36, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(sx, sy, 37, 15, 0, Math.PI, 0);
  ctx.quadraticCurveTo(sx + 20, sy + 12, sx, sy + 13);
  ctx.quadraticCurveTo(sx - 20, sy + 12, sx - 37, sy);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,50,55,0.5)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 9);
    ctx.lineTo(sx + Math.cos(a) * 36, sy + Math.sin(a) * 13);
    ctx.stroke();
  }
  ctx.fillStyle = '#3b2618';
  ctx.beginPath();
  ctx.arc(sx, sy - 9, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function coin(x, y, text) {
  ctx.save();
  ctx.fillStyle = 'rgba(42,26,14,0.82)';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 12, 50, 20, 10);
  ctx.fill();
  const g = ctx.createRadialGradient(x + 5, y - 4, 1, x + 7, y - 2, 9);
  g.addColorStop(0, '#fff0b0');
  g.addColorStop(1, '#c9962e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x + 7, y - 2, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3a14';
  ctx.fillRect(x + 5, y - 4, 4, 4);
  ctx.fillStyle = '#f6d98a';
  ctx.font = '600 13px "Noto Serif SC", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 17, y - 1.5);
  ctx.restore();
}

// ---------- 画 ----------
ground();
neighbor(-8.5, -1.5, 6.2, 5.5, 3.0);
neighbor(12.6, -9, 5, 5.2, 3.2);
tree(11.7, -1.6, '#e2b64a', 21, 1.1);
// 落叶
{
  const r = rng(9);
  for (let i = 0; i < 70; i++) {
    const [sx, sy] = P(11.7 + (r() - 0.3) * 5, -1.6 + (r() - 0.2) * 6, 0);
    ctx.fillStyle = rgba(r() < 0.5 ? '#e2b64a' : '#d39a32', 0.85);
    ctx.beginPath();
    ctx.ellipse(sx, sy, 2.2, 1.2, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

restaurantShell();

const tables = [
  { x: 3.1, y: 2.0, dishes: [[-0.2, -0.15, '#b5532b'], [0.2, 0.15, '#6f9a3a']], jug: true },
  { x: 5.2, y: 2.0, dishes: [[-0.15, 0.1, '#d9c37a']], jug: true },
  { x: 2.9, y: 4.6, dishes: [[0, 0, '#a83a2a'], [0.25, -0.25, '#e8e0c8'], [-0.25, 0.2, '#6f9a3a']] },
  { x: 5.3, y: 4.7, dishes: [[-0.2, 0, '#c8742e'], [0.2, 0.2, '#6f9a3a']], jug: true },
  { x: 8.1, y: 4.4, dishes: [[0.1, -0.1, '#e8e0c8'], [-0.2, 0.25, '#e8e0c8']] },
];

// 室内物件按深度（x + y）排序后画
const items = [];
const add = (d, fn) => items.push({ d, fn });
add(1.0, kitchen);
add(2.6, () => stand(8.3, 1.6, { robe: '#5b6f7a', trim: '#33414a', hat: 'chef', pose: 'cook', facing: 1 }));
add(3.9, () => stand(0.55, 3.35, { robe: '#475a6a', trim: '#2b3540', hat: 'futou', pose: 'abacus', beard: '#2a2420', facing: 1 }));
add(4.0, counter);
add(4.6, jars);
add(1.0, () => plant(0.5, 0.5));
for (const t of tables) {
  add(t.x + t.y - 0.56, () => bench(t.x, t.y - 0.6));
  add(t.x + t.y + 0.56, () => bench(t.x, t.y + 0.6));
  add(t.x + t.y, () => table(t));
}
add(5.1 - 0.5, () => seat(3.1, 1.42, { robe: '#5f7f8f', trim: '#2f4450', hat: 'futou', facing: 1 }));
add(5.1 + 0.62, () => seat(3.1, 2.62, { robe: '#c06a5a', trim: '#7a3a2e', hat: 'lady', back: true, facing: -1 }));
add(7.2 - 0.5, () => seat(5.0, 1.42, { robe: '#4f4a42', trim: '#2a2622', hat: 'rough', facing: 1 }));
add(7.2 - 0.5, () => seat(5.5, 1.42, { robe: '#6e5a3e', trim: '#3a2e1e', hat: 'rough', facing: -1 }));
add(7.5 - 0.5, () => seat(2.9, 4.02, { robe: '#8e2f2a', trim: '#c9a24a', hat: 'official', facing: 1 }));
add(10.0 - 0.5, () => seat(5.05, 4.12, { robe: '#8a6a3a', trim: '#4a3418', hat: 'futou', facing: 1 }));
add(10.0 + 0.62, () => seat(5.55, 5.32, { robe: '#3f6b5a', trim: '#c9a24a', hat: 'hu', beard: '#6a4a2a', back: true, facing: 1 }));
add(9.5, () => stand(6.85, 3.0, { robe: '#6a5038', trim: '#3b2a1c', hat: 'wrap', pose: 'tray', facing: -1 }));
add(10.0, () => plant(9.55, 0.45 + 2.7));
add(4.9, () => stand(2.95, 3.2, { robe: '#5a4a3a', trim: '#2a2016', hat: 'straw', s: 42, facing: -1 }));
items.sort((a, b) => a.d - b.d).forEach((it) => it.fn());

steam();

// 前沿栏杆、柱子、入口
railingY(7.0, 0, 2.85);
railingY(7.0, 5.55, 10);
railingX(10.0, 0, 7.0);
column(0, 7.0);
column(10, 7.0);
column(10, 3.5);
column(10, 0);
entrance();
lantern(10, 1.75, F + 2.55);
lantern(10, 5.25, F + 2.55);
lantern(2.85, 7.0, F + 2.5);
lantern(5.55, 7.0, F + 2.5);

// 门口迎客的小二站在台阶上
stand(3.45, 7.3, { robe: '#3e5a78', trim: '#24364a', hat: 'wrap', pose: 'bow', facing: 1, z: F });

// 街上
blossom(-3.6, 8.4);
wineFlag(-0.6, 7.6);
stall(0.6, 10.5);
stand(0.6, 9.95, { robe: '#7a5a3a', trim: '#3b2a1c', hat: 'bun', z: 0, facing: 1 });
umbrella(0.6, 10.5, 2.5, '#5f8f93');
stand(4.3, 8.05, { robe: '#e6dcc5', trim: '#4a6a8a', hat: 'futou', z: 0, back: true, facing: -1 });
stand(8.0, 8.9, { robe: '#7b6a4c', trim: '#3e3424', hat: 'straw', pose: 'pole', z: 0, facing: 1 });
stand(1.4, 8.8, { robe: '#d58f86', trim: '#7a3a2e', hat: 'lady', pose: 'walk', z: 0, facing: 1, flower: '#f0d060' });
stand(13.6, 4.2, { robe: '#5a6a4a', trim: '#2f3826', hat: 'bun', pose: 'walk', z: 0, facing: -1 });

// 下午的斜阳
{
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(255,220,150,0.65)');
  g.addColorStop(1, 'rgba(120,70,30,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
paperOverlay(ctx, W, H, 4, 0.9);

// 气泡（界面层，不受滤镜影响）
{
  const [ax, ay] = P(5.05, 4.12, F + 0.45);
  bubble(ctx, ax + 2, ay - 40, '听说城南米价又涨了…', { dx: 52 });
  const [bx, by] = P(5.5, 1.42, F + 0.45);
  bubble(ctx, bx + 2, by - 58, '小二！再来一壶！', { dx: 40 });
  const [cx, cy] = P(3.45, 7.3, F);
  bubble(ctx, cx + 2, cy - 46, '客官里面请～', { dx: -40 });
  const [dx, dy] = P(8.1, 4.4, F + 0.8);
  coin(dx - 18, dy - 16, '+38');
}

ready();
