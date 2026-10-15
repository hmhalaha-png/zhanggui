// 样张 D：横版剖面。两层饭馆去掉正面墙，像玩具屋一样看进去。
// 楼下：门口、柜台、楼梯、大堂、厨房；楼上：雅间、说书台、听书的客人。
import { rng, shade, paperOverlay, drawPerson, bubble, ready } from './common.js';

const W = 844, H = 390;
const dpr = window.devicePixelRatio || 1;
const cv = document.getElementById('c');
cv.width = W * dpr;
cv.height = H * dpr;
const ctx = cv.getContext('2d');
ctx.scale(dpr, dpr);
const R = rng(17);

const r = (x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};
const line = (x1, y1, x2, y2, c, w = 1) => {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

// 楼层高度
const ROOF_EAVE = 104, F2_TOP = 116, F2_FLOOR = 210, BEAM_H = 13, F1_TOP = 223, F1_FLOOR = 332;
const X0 = 58, X1 = 804;
const S1 = 58; // 人物身高

function sky() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f3e6c8');
  g.addColorStop(1, '#e2c99a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 远山
  for (const [base, amp, col, seed] of [[150, 60, 'rgba(120,130,125,0.28)', 3], [190, 45, 'rgba(95,105,100,0.32)', 8]]) {
    const rr = rng(seed);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, base - Math.abs(Math.sin(x / 90 + seed)) * amp - rr() * 10);
    ctx.lineTo(W, H);
    ctx.fill();
  }
  // 夕阳
  const sg = ctx.createRadialGradient(760, 70, 4, 760, 70, 60);
  sg.addColorStop(0, 'rgba(230,110,70,0.85)');
  sg.addColorStop(0.3, 'rgba(230,140,80,0.35)');
  sg.addColorStop(1, 'rgba(230,140,80,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(690, 0, 140, 140);
}

function street() {
  r(0, F1_FLOOR + 6, W, H - F1_FLOOR, '#cdb58c');
  for (let i = 0; i < 220; i++) {
    const x = R() * W, y = F1_FLOOR + 10 + R() * 50;
    ctx.fillStyle = R() < 0.5 ? 'rgba(110,80,45,0.18)' : 'rgba(255,245,220,0.25)';
    ctx.fillRect(x, y, 3 + R() * 6, 1.5);
  }
  // 台基
  r(X0 - 12, F1_FLOOR, X1 - X0 + 24, 9, '#bfae8e');
  r(X0 - 12, F1_FLOOR, X1 - X0 + 24, 2, '#d8c8a6');
  for (let x = X0 - 12; x < X1 + 12; x += 38) line(x, F1_FLOOR + 2, x, F1_FLOOR + 9, 'rgba(90,70,45,0.35)');
}

function willow(x, y) {
  ctx.strokeStyle = '#4e3426';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 6, y - 80, x - 6, y - 150);
  ctx.stroke();
  const rr = rng(4);
  for (let i = 0; i < 46; i++) {
    const sx = x - 40 + rr() * 80, sy = y - 170 + rr() * 50;
    ctx.strokeStyle = `rgba(${90 + rr() * 30},${130 + rr() * 30},70,0.75)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 6, sy + 40, sx + 2, sy + 70 + rr() * 50);
    ctx.stroke();
  }
}

function lattice(x, y, w, h) {
  r(x, y, w, h, '#f6ecd2');
  ctx.strokeStyle = '#5b3a24';
  ctx.lineWidth = 1.3;
  for (let i = 1; i < 6; i++) line(x + (w * i) / 6, y, x + (w * i) / 6, y + h, '#5b3a24', 1.3);
  for (let j = 1; j < 5; j++) line(x, y + (h * j) / 5, x + w, y + (h * j) / 5, '#5b3a24', 1.3);
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function walls() {
  // 楼上后墙
  r(X0, F2_TOP, X1 - X0, F2_FLOOR - F2_TOP, '#eadcbd');
  r(X0, F2_FLOOR - 22, X1 - X0, 22, '#7a5232');
  // 楼下后墙
  r(X0, F1_TOP, X1 - X0, F1_FLOOR - F1_TOP, '#e5d6b6');
  r(X0, F1_FLOOR - 26, X1 - X0, 26, '#7a5232');
  for (let x = X0; x < X1; x += 24) {
    line(x, F1_FLOOR - 26, x, F1_FLOOR, 'rgba(60,35,18,0.4)');
    line(x, F2_FLOOR - 22, x, F2_FLOOR, 'rgba(60,35,18,0.4)');
  }
  // 窗
  for (const x of [330, 470, 610]) lattice(x, F2_TOP + 16, 70, 46);
  lattice(470, F1_TOP + 14, 66, 44);
  // 背后的立柱
  for (const x of [300, 450, 600]) {
    r(x - 4, F2_TOP, 8, F2_FLOOR - F2_TOP, '#5b3a24');
    r(x - 4, F1_TOP, 8, F1_FLOOR - F1_TOP, '#5b3a24');
  }
  // 厨房墙熏黑
  const g = ctx.createLinearGradient(0, F1_TOP, 0, F1_TOP + 60);
  g.addColorStop(0, 'rgba(60,40,25,0.5)');
  g.addColorStop(1, 'rgba(60,40,25,0)');
  ctx.fillStyle = g;
  ctx.fillRect(612, F1_TOP, X1 - 612, 60);
}

function roof() {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(14, 84);
  ctx.quadraticCurveTo(70, 108, 170, ROOF_EAVE);
  ctx.lineTo(690, ROOF_EAVE);
  ctx.quadraticCurveTo(790, 108, 830, 84);
  ctx.quadraticCurveTo(780, 78, 706, 52);
  ctx.lineTo(138, 52);
  ctx.quadraticCurveTo(64, 78, 14, 84);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 52, 0, ROOF_EAVE);
  g.addColorStop(0, '#5a5f66');
  g.addColorStop(1, '#3e4248');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  for (let x = 10; x < 840; x += 8) {
    line(x, 40, x + (x - 422) * 0.12, 112, 'rgba(20,20,24,0.45)', 2.2);
    line(x + 3, 40, x + 3 + (x - 422) * 0.12, 112, 'rgba(255,255,255,0.07)', 1);
  }
  ctx.restore();
  // 瓦当
  for (let x = 30; x < 820; x += 8) {
    const t = (x - 422) / 400;
    const y = ROOF_EAVE - Math.max(0, Math.abs(t) - 0.62) * 50;
    ctx.fillStyle = '#2e3136';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // 正脊 + 鸱吻
  r(132, 43, 580, 11, '#2b2a2c');
  r(132, 41, 580, 3, '#3c3b3e');
  for (const [x, dir] of [[132, -1], [712, 1]]) {
    ctx.fillStyle = '#2b2a2c';
    ctx.beginPath();
    ctx.moveTo(x, 54);
    ctx.lineTo(x, 40);
    ctx.quadraticCurveTo(x + dir * 4, 24, x + dir * 16, 26);
    ctx.quadraticCurveTo(x + dir * 8, 32, x + dir * 12, 40);
    ctx.quadraticCurveTo(x + dir * 14, 50, x, 54);
    ctx.fill();
  }
  // 斗拱
  r(X0, ROOF_EAVE, X1 - X0, F2_TOP - ROOF_EAVE, '#5b3a24');
  for (let x = X0 + 4; x < X1 - 10; x += 22) {
    r(x, ROOF_EAVE + 2, 14, 4, '#3f6f6a');
    r(x + 3, ROOF_EAVE + 6, 8, 5, '#a8342a');
    r(x + 14, ROOF_EAVE + 5, 8, 3, '#2f4f6a');
  }
}

function beam(y) {
  r(X0 - 6, y, X1 - X0 + 12, BEAM_H, '#5b3a24');
  r(X0 - 6, y + 2, X1 - X0 + 12, 4, '#3f6f6a');
  for (let x = X0; x < X1; x += 60) {
    r(x + 10, y + 2, 26, 4, '#2f4f6a');
    r(x + 20, y + 2, 6, 4, '#c9a24a');
  }
  r(X0 - 6, y + BEAM_H - 2, X1 - X0 + 12, 2, '#2a1a10');
}

function column(x, y0, y1) {
  const g = ctx.createLinearGradient(x - 6, 0, x + 6, 0);
  g.addColorStop(0, '#b0483a');
  g.addColorStop(1, '#7a2a20');
  ctx.fillStyle = g;
  ctx.fillRect(x - 6, y0, 12, y1 - y0);
  r(x - 9, y1 - 6, 18, 6, '#b7a98c');
}

function lantern(x, y) {
  const g = ctx.createRadialGradient(x, y + 12, 2, x, y + 12, 40);
  g.addColorStop(0, 'rgba(255,190,90,0.55)');
  g.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 40, y - 28, 80, 80);
  line(x, y - 10, x, y, '#2a1a10');
  const lg = ctx.createRadialGradient(x - 2, y + 9, 1, x, y + 11, 10);
  lg.addColorStop(0, '#ffd27a');
  lg.addColorStop(0.5, '#e0502e');
  lg.addColorStop(1, '#9c2a1c');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.ellipse(x, y + 11, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  r(x - 5, y, 10, 2.5, '#2a1a10');
  r(x - 5, y + 20, 10, 2.5, '#2a1a10');
  line(x, y + 22, x, y + 32, '#e9b54a', 1.5);
}

function sideTable(cx, floorY, w = 64, dishes = []) {
  const top = floorY - 30;
  r(cx - w / 2, top, w, 5, '#8a5530');
  r(cx - w / 2, top, w, 1.5, '#a8703f');
  r(cx - w / 2 + 3, top + 5, w - 6, 4, '#6e4024');
  r(cx - w / 2 + 4, top + 9, 4, 21, '#5a321c');
  r(cx + w / 2 - 8, top + 9, 4, 21, '#5a321c');
  dishes.forEach(([dx, c]) => {
    ctx.fillStyle = '#f4efe2';
    ctx.beginPath();
    ctx.ellipse(cx + dx, top - 1, 8, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx + dx, top - 2.5, 5, 2.4, 0, Math.PI, 0);
    ctx.fill();
  });
}
function stool(cx, floorY) {
  r(cx - 9, floorY - 17, 18, 4, '#8a5a34');
  r(cx - 7, floorY - 13, 3, 13, '#5a321c');
  r(cx + 4, floorY - 13, 3, 13, '#5a321c');
}
const sitAt = (x, floorY, opt) => drawPerson(ctx, x, floorY - 15, S1, { ...opt, pose: 'sit', noShadow: true });
const standAt = (x, floorY, opt) => drawPerson(ctx, x, floorY, opt.s || S1, opt);

function railing(y, x0, x1) {
  r(x0, y - 22, x1 - x0, 3, '#8e3326');
  for (let x = x0 + 4; x < x1; x += 11) r(x, y - 19, 3, 19, 'rgba(110,40,30,0.92)');
  r(x0, y - 3, x1 - x0, 3, '#6b2a20');
}

// ---------- 楼上 ----------
function floor2() {
  // 雅间：屏风 + 圆桌
  r(70, F2_TOP + 10, 200, 70, '#5b3a24');
  for (let i = 0; i < 4; i++) {
    const x = 74 + i * 49;
    r(x, F2_TOP + 14, 45, 62, '#efe4c8');
    ctx.fillStyle = 'rgba(80,95,90,0.4)';
    ctx.beginPath();
    ctx.moveTo(x + 2, F2_TOP + 70);
    ctx.lineTo(x + 14 + (i % 2) * 8, F2_TOP + 34);
    ctx.lineTo(x + 26, F2_TOP + 54);
    ctx.lineTo(x + 34, F2_TOP + 40);
    ctx.lineTo(x + 43, F2_TOP + 70);
    ctx.fill();
  }
  r(292, F2_TOP, 6, F2_FLOOR - F2_TOP, '#5b3a24');
  lantern(170, F2_TOP);
  sitAt(128, F2_FLOOR, { robe: '#8e2f2a', trim: '#c9a24a', hat: 'official', facing: 1 });
  sitAt(216, F2_FLOOR, { robe: '#b86a8a', trim: '#7a3a5a', hat: 'lady', facing: -1, flower: '#f0d060' });
  sideTable(172, F2_FLOOR, 70, [[-18, '#b5532b'], [0, '#e8d27a'], [18, '#6f9a3a']]);
  standAt(256, F2_FLOOR, { robe: '#6a8a7a', trim: '#3a5a4a', hat: 'lady', facing: -1, pose: 'tray', s: 54 });

  // 说书台
  r(318, F2_TOP + 8, 34, 64, '#a8342a');
  ctx.fillStyle = '#f3dfae';
  ctx.font = '600 15px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  [...'说书'].forEach((ch, i) => ctx.fillText(ch, 335, F2_TOP + 34 + i * 22));
  r(310, F2_FLOOR - 12, 118, 12, '#6e4024');
  r(310, F2_FLOOR - 12, 118, 2, '#8a5530');
  standAt(362, F2_FLOOR - 12, { robe: '#3d4a5a', trim: '#22303c', hat: 'futou', pose: 'fan', facing: 1, beard: '#cfc6b4' });
  r(384, F2_FLOOR - 36, 34, 4, '#7a4a2a');
  r(387, F2_FLOOR - 32, 3, 20, '#5a321c');
  r(412, F2_FLOOR - 32, 3, 20, '#5a321c');
  r(394, F2_FLOOR - 40, 10, 4, '#3b2213');
  lantern(390, F2_TOP);

  // 听书的客人
  for (const [cx, people] of [
    [512, [{ robe: '#5f7f8f', hat: 'futou' }, { robe: '#8a6a3a', hat: 'bun' }]],
    [640, [{ robe: '#3f6b5a', hat: 'hu', beard: '#6a4a2a' }, { robe: '#e6dcc5', trim: '#4a6a8a', hat: 'futou' }]],
  ]) {
    stool(cx - 46, F2_FLOOR);
    stool(cx + 44, F2_FLOOR);
    sitAt(cx - 44, F2_FLOOR, { ...people[0], facing: -1 });
    sitAt(cx + 46, F2_FLOOR, { ...people[1], facing: -1 });
    sideTable(cx, F2_FLOOR, 60, [[-12, '#e8e0c8'], [12, '#c8742e']]);
  }
  lantern(576, F2_TOP);
  // 楼梯口栏杆
  r(712, F2_FLOOR - 26, 4, 26, '#5b3a24');
}

// ---------- 楼下 ----------
function floor1() {
  // 门口：门框 + 门帘
  r(X0 + 2, F1_TOP + 4, 70, F1_FLOOR - F1_TOP - 4, '#3b2618');
  r(X0 + 8, F1_TOP + 10, 58, F1_FLOOR - F1_TOP - 10, '#f3e6c8');
  r(X0 + 8, F1_TOP + 10, 58, 48, '#3e6a8a');
  r(X0 + 8, F1_TOP + 10, 58, 4, '#2f4f6a');
  ctx.fillStyle = '#f3dfae';
  ctx.font = '22px "Ma Shan Zheng", serif';
  ctx.textAlign = 'center';
  ctx.fillText('福', X0 + 37, F1_TOP + 46);

  // 柜台 + 掌柜 + 酒架 + 菜牌
  const dishes = ['红烧肉', '糖醋鱼', '东坡肘', '桂花糕', '阳春面', '女儿红'];
  dishes.forEach((d, i) => {
    const x = 146 + i * 19;
    r(x, F1_TOP + 5, 15, 42, i === 5 ? '#a8342a' : '#3b2618');
    ctx.fillStyle = '#ecd9a8';
    ctx.font = '600 11px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    [...d].forEach((ch, k) => ctx.fillText(ch, x + 7.5, F1_TOP + 18 + k * 12));
  });
  r(146, F1_TOP + 64, 110, 4, '#5b3a24');
  for (let i = 0; i < 6; i++) {
    const x = 152 + i * 18;
    ctx.fillStyle = '#6a3a22';
    ctx.beginPath();
    ctx.ellipse(x + 6, F1_TOP + 56, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    r(x + 3, F1_TOP + 53, 6, 6, '#c23a2c');
  }
  standAt(200, F1_FLOOR, { robe: '#475a6a', trim: '#2b3540', hat: 'futou', pose: 'abacus', beard: '#2a2420', facing: 1 });
  r(140, F1_FLOOR - 34, 122, 34, '#6b3d22');
  r(136, F1_FLOOR - 38, 130, 6, '#4a2a17');
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = 'rgba(233,201,122,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(146 + i * 29, F1_FLOOR - 28, 24, 22);
  }
  r(160, F1_FLOOR - 44, 22, 6, '#3b2213');
  for (let i = 0; i < 7; i++) r(162 + i * 3, F1_FLOOR - 43 + (i % 2), 2, 2, '#c9a24a');
  r(226, F1_FLOOR - 43, 16, 5, '#eadcb8');

  // 楼梯
  const sx0 = 276, sx1 = 392;
  ctx.fillStyle = '#7a4a2a';
  ctx.beginPath();
  ctx.moveTo(sx0, F1_FLOOR);
  ctx.lineTo(sx1, F1_TOP - BEAM_H);
  ctx.lineTo(sx1 + 12, F1_TOP - BEAM_H);
  ctx.lineTo(sx0 + 16, F1_FLOOR);
  ctx.fill();
  const steps = 9;
  for (let i = 0; i < steps; i++) {
    const x = sx0 + ((sx1 - sx0) * i) / steps, y = F1_FLOOR - ((F1_FLOOR - F1_TOP + BEAM_H) * (i + 1)) / steps;
    r(x, y, (sx1 - sx0) / steps + 12, 3, '#9a6236');
  }
  line(sx0 + 4, F1_FLOOR - 30, sx1 + 4, F1_TOP - BEAM_H - 30, '#5b3a24', 3);
  for (let i = 0; i <= steps; i += 2) {
    const x = sx0 + 4 + ((sx1 - sx0) * i) / steps, y = F1_FLOOR - ((F1_FLOOR - F1_TOP + BEAM_H) * i) / steps;
    line(x, y, x, y - 30, '#5b3a24', 2);
  }

  // 大堂两张桌
  lantern(450, F1_TOP);
  for (const [cx, a, b, dishes] of [
    [452, { robe: '#8a6a3a', trim: '#4a3418', hat: 'futou' }, { robe: '#c06a5a', trim: '#7a3a2e', hat: 'lady' }, [[-14, '#a83a2a'], [12, '#6f9a3a']]],
    [566, { robe: '#4f4a42', trim: '#2a2622', hat: 'rough' }, { robe: '#6e5a3e', trim: '#3a2e1e', hat: 'rough' }, [[-10, '#d9c37a']]],
  ]) {
    stool(cx - 46, F1_FLOOR);
    stool(cx + 44, F1_FLOOR);
    sitAt(cx - 44, F1_FLOOR, { ...a, facing: 1 });
    sitAt(cx + 46, F1_FLOOR, { ...b, facing: -1 });
    sideTable(cx, F1_FLOOR, 64, dishes);
    // 酒壶
    ctx.fillStyle = '#5e7f86';
    ctx.beginPath();
    ctx.ellipse(cx + 22, F1_FLOOR - 38, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    r(cx + 20, F1_FLOOR - 48, 4, 4, '#5e7f86');
  }

  // 厨房：半墙 + 传菜口
  r(612, F1_FLOOR - 56, 10, 56, '#e2d4b6');
  r(606, F1_FLOOR - 60, 22, 6, '#8b6a48');
  ctx.fillStyle = '#f4efe2';
  ctx.beginPath();
  ctx.ellipse(617, F1_FLOOR - 62, 8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // 灶台
  r(690, F1_FLOOR - 44, 104, 44, '#9a5a3c');
  r(686, F1_FLOOR - 48, 112, 6, '#b98a66');
  for (let x = 694; x < 790; x += 14) line(x, F1_FLOOR - 40 + ((x / 14) % 2) * 10, x + 8, F1_FLOOR - 40 + ((x / 14) % 2) * 10, '#7d4630', 1.5);
  for (const [wx, food] of [[716, '#b5532b'], [764, '#d9c37a']]) {
    ctx.fillStyle = '#2b2622';
    ctx.beginPath();
    ctx.ellipse(wx, F1_FLOOR - 49, 18, 6, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = food;
    ctx.beginPath();
    ctx.ellipse(wx, F1_FLOOR - 50, 11, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    const fg = ctx.createRadialGradient(wx, F1_FLOOR - 14, 2, wx, F1_FLOOR - 14, 16);
    fg.addColorStop(0, '#ffe08a');
    fg.addColorStop(0.5, '#ef7a2c');
    fg.addColorStop(1, '#4a1e10');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(wx, F1_FLOOR - 12, 11, Math.PI, 0);
    ctx.lineTo(wx + 11, F1_FLOOR - 4);
    ctx.lineTo(wx - 11, F1_FLOOR - 4);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(255,252,245,${0.3 * (1 - i / 8)})`;
      ctx.beginPath();
      ctx.arc(wx + Math.sin(i * 1.3) * 6, F1_FLOOR - 60 - i * 8, 6 + i * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  r(780, F1_TOP, 14, F1_FLOOR - 48 - F1_TOP, '#8a5038');
  standAt(664, F1_FLOOR, { robe: '#5b6f7a', trim: '#33414a', hat: 'chef', pose: 'cook', facing: 1 });
  // 菜篮、水缸
  ctx.fillStyle = '#4c4038';
  ctx.beginPath();
  ctx.ellipse(640, F1_FLOOR - 4, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  r(626, F1_FLOOR - 30, 28, 26, '#4c4038');
  r(628, F1_FLOOR - 32, 24, 4, '#5d8c94');
  // 小二端菜
  standAt(512, F1_FLOOR, { robe: '#6a5038', trim: '#3b2a1c', hat: 'wrap', pose: 'tray', facing: -1 });
  // 门口迎客
  standAt(118, F1_FLOOR, { robe: '#3e5a78', trim: '#24364a', hat: 'wrap', pose: 'bow', facing: -1 });
  lantern(240, F1_TOP);
  lantern(650, F1_TOP);
}

// ---------- 画 ----------
sky();
willow(30, F1_FLOOR + 4);
street();
walls();
floor2();
floor1();
beam(F2_FLOOR);
railing(F2_FLOOR, X0, 708);
roof();
// 匾额
{
  const x = 548, y = F2_TOP + 2, w = 124, h = 30;
  r(x - 3, y - 3, w + 6, h + 6, '#2a1a10');
  r(x, y, w, h, '#3b2618');
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = '#ecc865';
  ctx.font = '22px "Ma Shan Zheng", serif';
  ctx.textAlign = 'center';
  ctx.fillText('福来饭馆', x + w / 2, y + 23);
}
for (const x of [X0, X1]) {
  column(x, F2_TOP, F2_FLOOR);
  column(x, F1_TOP, F1_FLOOR);
}
// 街上路人
standAt(338, H - 8, { robe: '#7b6a4c', trim: '#3e3424', hat: 'straw', pose: 'pole', facing: -1, s: 60 });
standAt(560, H - 6, { robe: '#d58f86', trim: '#7a3a2e', hat: 'lady', pose: 'walk', facing: 1, s: 58, flower: '#f0d060' });

// 傍晚的暖光
{
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const g = ctx.createLinearGradient(W, 0, 0, H);
  g.addColorStop(0, 'rgba(255,170,100,0.6)');
  g.addColorStop(1, 'rgba(90,50,30,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
paperOverlay(ctx, W, H, 6, 0.85);

bubble(ctx, 362, F2_FLOOR - 12 - S1 - 6, '话说那年永安镇来了个大盗……', { dx: 30 });
bubble(ctx, 408, F1_FLOOR - 15 - 46, '听说城南米价又涨了…', { dx: -26 });
bubble(ctx, 612, F1_FLOOR - 15 - 46, '小二！再来一壶！', { dx: 4 });
bubble(ctx, 118, F1_FLOOR - S1 - 6, '客官里面请～', { dx: 24 });

ready();
