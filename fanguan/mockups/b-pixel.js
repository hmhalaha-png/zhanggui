// 样张 B：像素风，正面俯视剖开的店堂（类似开罗游戏的视角）。
// 逻辑分辨率 281×130，每个像素放大 3 倍。
import { rng, ready } from './common.js';

const LW = 281, LH = 130, S = 3;
const cv = document.getElementById('c');
cv.width = LW;
cv.height = LH;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const R = rng(5);
const r = (x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
};

const C = {
  ol: '#2b1d14',
  wood: '#a8743f', wood2: '#9d6a37', seam: '#7a5028',
  post: '#5b3a24', wall: '#ecdcb8', wain: '#8a5a34', wain2: '#7a4e2c',
  roof: '#3c4046', roof2: '#4f545b',
  red: '#c8392b', gold: '#f2c14e',
  table: '#9a6236', tableHi: '#b67c48', tableFace: '#6e4024', bench: '#8a5a34',
  skin: '#f1c9a0', hair: '#2a1e18', white: '#f6f0e2',
};

// ---------- 小人精灵：先在小画布上用色块拼，再自动描轮廓 ----------
function sprite(opt) {
  const c = document.createElement('canvas');
  c.width = 18;
  c.height = 24;
  const g = c.getContext('2d');
  const f = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const sit = opt.pose === 'sit';
  const oy = sit ? 3 : 0;
  const robe = opt.robe, dark = opt.dark, trim = opt.trim || dark;
  // 身体
  if (!sit) {
    f(5, 21, 3, 2, C.ol);
    f(10, 21, 3, 2, C.ol);
  }
  f(5, 13 + oy, 8, sit ? 6 : 6, robe);
  if (!sit) f(4, 18, 10, 3, robe);
  f(9, 13 + oy, 4, sit ? 6 : 8, dark); // 暗面
  if (!sit) f(10, 18, 4, 3, dark);
  f(5, 16 + oy, 8, 1, trim); // 腰带
  if (!opt.back) {
    f(7, 13 + oy, 1, 1, C.white);
    f(8, 14 + oy, 1, 1, C.white);
    f(10, 13 + oy, 1, 1, C.white);
  }
  // 手臂
  if (opt.pose === 'tray') {
    f(3, 14 + oy, 2, 3, dark);
    f(13, 13 + oy, 3, 2, dark);
    f(11, 12 + oy, 7, 2, '#6b3f22');
    f(12, 11 + oy, 2, 1, C.white);
    f(15, 11 + oy, 2, 1, '#d24a2a');
  } else if (opt.pose === 'bow') {
    f(5, 15 + oy, 8, 2, dark);
    f(8, 15 + oy, 2, 2, C.skin);
  } else {
    f(3, 14 + oy, 2, 4, dark);
    f(13, 14 + oy, 2, 4, dark);
    f(3, 18 + oy, 2, 1, C.skin);
    f(13, 18 + oy, 2, 1, C.skin);
  }
  // 头
  f(5, 6 + oy, 8, 7, C.skin);
  f(5, 6 + oy, 1, 1, 'rgba(0,0,0,0)');
  if (opt.back) {
    f(5, 5 + oy, 8, 8, C.hair);
  } else {
    f(5, 5 + oy, 8, 3, C.hair);
    f(5, 7 + oy, 1, 3, C.hair);
    f(12, 7 + oy, 1, 3, C.hair);
    f(7, 9 + oy, 1, 2, C.ol);
    f(10, 9 + oy, 1, 2, C.ol);
    f(6, 11 + oy, 1, 1, '#e8908a');
    f(11, 11 + oy, 1, 1, '#e8908a');
  }
  // 帽子 / 发型
  switch (opt.hat) {
    case 'futou':
      f(5, 2 + oy, 8, 4, '#1b1714');
      f(6, 1 + oy, 6, 1, '#1b1714');
      f(4, 5 + oy, 1, 4, '#1b1714');
      break;
    case 'official':
      f(5, 1 + oy, 8, 5, '#141210');
      f(0, 3 + oy, 18, 1, '#141210');
      f(5, 5 + oy, 8, 1, C.gold);
      break;
    case 'straw':
      f(2, 5 + oy, 14, 1, '#b08a4a');
      f(3, 4 + oy, 12, 1, '#c9a568');
      f(5, 3 + oy, 8, 1, '#d4b47a');
      f(7, 2 + oy, 4, 1, '#d4b47a');
      break;
    case 'wrap':
      f(5, 3 + oy, 8, 3, C.white);
      f(4, 4 + oy, 1, 2, C.white);
      break;
    case 'chef':
      f(5, 0 + oy, 8, 6, C.white);
      f(6, 0 + oy, 6, 1, '#e2dccc');
      break;
    case 'lady':
      f(3, 3 + oy, 3, 3, C.hair);
      f(12, 3 + oy, 3, 3, C.hair);
      f(5, 4 + oy, 8, 2, C.hair);
      f(13, 6 + oy, 2, 1, opt.flower || C.red);
      break;
    case 'hu':
      f(6, 0 + oy, 6, 2, '#5e4630');
      f(5, 2 + oy, 8, 3, '#5e4630');
      f(5, 5 + oy, 8, 1, '#2f6b6a');
      break;
    case 'rough':
      for (let i = 0; i < 4; i++) f(5 + i * 2, 3 + oy + (i % 2), 2, 2, C.hair);
      f(5, 5 + oy, 8, 1, C.red);
      break;
    default:
      f(7, 2 + oy, 4, 3, C.hair);
      f(6, 3 + oy, 1, 1, C.gold);
  }
  if (opt.beard) {
    f(7, 12 + oy, 4, 2, opt.beard);
  }
  // 自动描边：透明像素挨着不透明像素就涂深色
  const img = g.getImageData(0, 0, 18, 24);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < 18 && y < 24 && d[(y * 18 + x) * 4 + 3] > 0;
  const out = [];
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 18; x++) {
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) out.push([x, y]);
    }
  }
  g.fillStyle = C.ol;
  for (const [x, y] of out) g.fillRect(x, y, 1, 1);
  if (opt.flip) {
    const c2 = document.createElement('canvas');
    c2.width = 18;
    c2.height = 24;
    const g2 = c2.getContext('2d');
    g2.translate(18, 0);
    g2.scale(-1, 1);
    g2.drawImage(c, 0, 0);
    return c2;
  }
  return c;
}
// 脚底中心在 (x, y)
function person(x, y, opt) {
  if (opt.pose !== 'sit') {
    ctx.fillStyle = 'rgba(40,20,8,0.25)';
    ctx.fillRect(x - 5, y - 1, 10, 2);
  }
  ctx.drawImage(sprite(opt), (x - 9) | 0, (y - 23) | 0);
}

// ---------- 房子 ----------
function shell() {
  // 屋檐（剖开的断面）
  r(0, 0, LW, 9, C.roof);
  for (let x = 0; x < LW; x += 4) r(x, 0, 2, 8, C.roof2);
  r(0, 8, LW, 1, '#24262a');
  // 后墙
  r(0, 9, LW, 3, C.post);
  r(0, 12, LW, 19, C.wall);
  r(0, 31, LW, 9, C.wain);
  for (let x = 4; x < LW; x += 12) r(x, 32, 1, 7, C.wain2);
  r(0, 31, LW, 1, '#6e4628');
  r(0, 39, LW, 1, C.post);
  for (const x of [0, 46, 92, 138, 184, 278]) r(x, 9, 3, 31, C.post);
  // 格窗
  for (const wx of [52, 100, 146]) {
    r(wx, 14, 18, 13, C.post);
    r(wx + 1, 15, 16, 11, '#f7eed6');
    for (let i = 1; i < 4; i++) r(wx + 1 + i * 4, 15, 1, 11, C.post);
    for (let j = 1; j < 3; j++) r(wx + 1, 15 + j * 4, 16, 1, C.post);
  }
  // 挂画
  r(122, 13, 10, 17, '#6a4a2e');
  r(123, 14, 8, 15, '#efe6cf');
  r(124, 22, 2, 5, '#7d8a86');
  r(126, 19, 2, 8, '#6a7874');
  r(128, 23, 2, 4, '#7d8a86');
  // 菜牌
  for (let i = 0; i < 6; i++) {
    const x = 8 + i * 6;
    r(x, 14, 4, 13, i === 5 ? C.red : '#3b2618');
    for (let k = 0; k < 3; k++) r(x + 1, 16 + k * 4, 2, 2, '#ecd9a8');
  }
  // 厨房一段墙熏黑
  r(207, 12, 71, 19, '#d6c39c');
  r(207, 12, 71, 5, '#b9a47c');
  r(212, 22, 26, 2, C.post);
  for (let i = 0; i < 6; i++) r(213 + i * 4, 19, 3, 3, i % 2 ? C.white : '#7d9aa0');
  // 灯笼
  for (const lx of [24, 70, 116, 162]) {
    r(lx, 12, 1, 2, C.ol);
    r(lx - 2, 14, 5, 1, C.ol);
    r(lx - 3, 15, 7, 5, C.red);
    r(lx - 2, 15, 2, 4, '#f06a4a');
    r(lx - 2, 20, 5, 1, C.ol);
    r(lx, 21, 1, 2, C.gold);
  }
}

function floor() {
  for (let y = 40, row = 0; y < 120; y += 5, row++) {
    r(0, y, 204, 5, row % 2 ? C.wood : C.wood2);
    r(0, y, 204, 1, C.seam);
    for (let x = (R() * 30) | 0; x < 204; x += 24 + ((R() * 20) | 0)) r(x, y, 1, 5, C.seam);
  }
  // 厨房石板地
  for (let y = 40; y < 120; y += 8) {
    for (let x = 207; x < LW; x += 9) {
      r(x, y, 9, 8, ((x + y) / 1) % 2 ? '#bdb5a3' : '#b0a894');
      r(x, y, 9, 1, '#968e7c');
      r(x, y, 1, 8, '#968e7c');
    }
  }
  // 地板反光
  for (let i = 0; i < 40; i++) r(R() * 204, 41 + R() * 78, 4, 1, 'rgba(255,230,190,0.18)');
}

function partition() {
  r(204, 40, 3, 72, C.post);
  r(204, 40, 1, 72, '#7a5232');
  // 传菜口
  r(201, 64, 9, 12, '#b07a46');
  r(201, 64, 9, 1, '#d09a5e');
  r(202, 66, 4, 2, C.white);
  r(203, 66, 2, 1, '#c84a2a');
  r(202, 71, 4, 2, C.white);
  r(203, 71, 2, 1, '#6f9a3a');
}

function front() {
  r(0, 120, 22, 2, '#6e4628');
  r(46, 120, LW - 46, 2, '#6e4628');
  for (let x = 1; x < LW; x += 4) if (x < 22 || x > 46) r(x, 122, 1, 3, C.post);
  r(0, 125, 22, 1, '#4a2e1a');
  r(46, 125, LW - 46, 1, '#4a2e1a');
  r(22, 120, 24, 5, '#c9b896');
  r(22, 124, 24, 1, '#a89878');
  for (const x of [0, 21, 46, 138, 204, 278]) {
    r(x, 116, 3, 9, '#8e3326');
    r(x, 116, 1, 9, '#b0483a');
  }
  // 街
  r(0, 126, LW, 4, '#cdbf9f');
  for (let i = 0; i < 60; i++) r(R() * LW, 126 + R() * 4, 2, 1, '#b5a684');
}

function counter() {
  r(4, 49, 32, 7, '#8a5530');
  r(4, 49, 32, 1, '#a86a3c');
  r(4, 56, 32, 8, '#6b3d22');
  for (let i = 0; i < 4; i++) r(6 + i * 8, 58, 6, 4, '#7c4a2a');
  r(4, 63, 32, 1, C.ol);
  r(10, 50, 9, 4, '#3b2213');
  for (let i = 0; i < 4; i++) r(11 + i * 2, 51 + (i % 2), 1, 1, C.gold);
  r(24, 50, 7, 4, '#eadcb8');
  r(25, 51, 5, 1, '#9c8a6a');
}

function jars() {
  for (const jx of [5, 13, 21, 29]) {
    r(jx, 34, 7, 7, '#6a3a22');
    r(jx + 1, 33, 5, 1, '#6a3a22');
    r(jx + 1, 32, 5, 1, C.red);
    r(jx + 5, 35, 1, 5, '#4f2a18');
    r(jx + 2, 36, 3, 3, C.red);
    r(jx + 3, 37, 1, 1, C.gold);
    r(jx, 41, 7, 1, 'rgba(30,15,5,0.4)');
  }
}

function table(cx, cy, dishes = []) {
  r(cx - 9, cy - 4, 18, 7, C.table);
  r(cx - 9, cy - 4, 18, 1, C.tableHi);
  r(cx - 9, cy + 3, 18, 3, C.tableFace);
  r(cx - 9, cy + 6, 2, 3, '#5a321c');
  r(cx + 7, cy + 6, 2, 3, '#5a321c');
  r(cx - 9, cy - 5, 18, 1, C.ol);
  for (const [dx, dy, food] of dishes) {
    r(cx + dx, cy + dy, 5, 2, C.white);
    r(cx + dx + 1, cy + dy, 3, 1, food);
  }
}
function benchBack(cx, cy) {
  r(cx - 8, cy - 9, 16, 2, C.bench);
  r(cx - 8, cy - 7, 16, 1, '#6e4628');
}
function benchFront(cx, cy) {
  r(cx - 8, cy + 10, 16, 2, C.bench);
  r(cx - 8, cy + 12, 16, 2, '#6e4628');
  r(cx - 7, cy + 14, 1, 2, '#5a321c');
  r(cx + 6, cy + 14, 1, 2, '#5a321c');
}

function kitchen() {
  // 烟囱
  r(244, 9, 7, 25, '#8a5038');
  r(244, 9, 2, 25, '#a3654a');
  // 灶台
  r(211, 33, 40, 9, '#b98a66');
  r(211, 33, 40, 1, '#d0a27c');
  r(211, 42, 40, 9, '#9a5a3c');
  for (let x = 213; x < 251; x += 6) r(x, 44 + ((x / 6) % 2) * 3, 4, 1, '#7d4630');
  r(211, 51, 40, 1, C.ol);
  for (const [wx, food] of [[219, '#c4532b'], [235, '#d9c37a']]) {
    r(wx - 5, 35, 11, 4, '#2b2622');
    r(wx - 4, 34, 9, 1, '#2b2622');
    r(wx - 2, 36, 5, 2, food);
    r(wx - 2, 45, 5, 4, '#3a160c');
    r(wx - 1, 46, 3, 3, '#f08a2c');
    r(wx, 47, 1, 2, '#ffe08a');
  }
  // 蒸汽
  for (let i = 0; i < 26; i++) {
    const wx = i % 2 ? 219 : 235;
    ctx.fillStyle = `rgba(250,248,240,${0.75 - (i / 26) * 0.5})`;
    ctx.fillRect(wx - 3 + ((R() * 7) | 0), 32 - ((i / 2) | 0) * 1.5 - R() * 4, 2, 2);
  }
  // 菜架
  r(262, 28, 16, 2, C.post);
  r(262, 37, 16, 2, C.post);
  for (let i = 0; i < 4; i++) {
    r(263 + i * 4, 25, 3, 3, ['#6f9a3a', '#e07a2a', '#c8392b', '#e8d27a'][i]);
    r(263 + i * 4, 34, 3, 3, ['#e8d27a', '#6f9a3a', '#6f9a3a', '#e07a2a'][i]);
  }
  // 案板
  r(236, 82, 26, 6, '#c8a678');
  r(236, 82, 26, 1, '#ddc092');
  r(236, 88, 26, 4, '#8a6440');
  r(236, 92, 2, 3, '#5a321c');
  r(260, 92, 2, 3, '#5a321c');
  r(240, 83, 4, 3, '#6f9a3a');
  r(248, 84, 7, 2, '#8aa0aa');
  r(254, 84, 2, 2, '#5e7380');
  r(257, 83, 3, 1, '#c8c8c8');
  // 水缸
  r(262, 100, 12, 9, '#4c4038');
  r(263, 99, 10, 2, '#5d8c94');
  r(264, 99, 4, 1, '#9cc4c8');
  r(262, 109, 12, 1, C.ol);
}

function plant(x, y) {
  r(x - 3, y - 4, 7, 5, '#5e7f86');
  r(x - 3, y - 4, 7, 1, '#7a9aa0');
  for (const [dx, dy] of [[-4, -8], [-1, -10], [2, -9], [-3, -6], [1, -6], [3, -6], [0, -12]]) r(x + dx, y + dy, 3, 2, '#5d8a45');
  r(x - 1, y - 11, 2, 1, '#7aaa5a');
}

// 头顶的图标气泡
function icon(x, y, kind) {
  r(x - 5, y - 9, 11, 9, C.ol);
  r(x - 4, y - 8, 9, 7, '#fffaf0');
  r(x - 1, y, 3, 1, C.ol);
  r(x, y + 1, 1, 1, C.ol);
  if (kind === 'heart') {
    r(x - 3, y - 7, 2, 1, C.red);
    r(x + 1, y - 7, 2, 1, C.red);
    r(x - 3, y - 6, 6, 2, C.red);
    r(x - 2, y - 4, 4, 1, C.red);
    r(x - 1, y - 3, 2, 1, C.red);
  } else if (kind === 'coin') {
    r(x - 2, y - 7, 5, 5, '#d9a23a');
    r(x - 1, y - 7, 3, 1, '#f6d77a');
    r(x, y - 5, 1, 1, '#6b4a1a');
  } else {
    r(x, y - 7, 1, 4, C.red);
    r(x, y - 2, 1, 1, C.red);
  }
}

// ---------- 画 ----------
shell();
floor();
jars();
kitchen();

const tables = [
  [72, 62, [[-7, -3, '#c4532b'], [2, -1, '#6f9a3a']]],
  [116, 62, [[-6, -2, '#d9c37a'], [3, -3, '#c4532b']]],
  [160, 62, [[-4, -2, '#6f9a3a']]],
  [72, 96, [[-6, -2, '#c4532b'], [2, -3, '#e8e0c8'], [1, 0, '#6f9a3a']]],
  [116, 96, [[-5, -2, '#c87a2e']]],
  [160, 96, [[-6, -2, '#e8e0c8'], [2, -1, '#e8e0c8']]],
];

const items = [];
const add = (y, fn) => items.push({ y, fn });
add(54, () => person(14, 54, { robe: '#475a6a', dark: '#34434f', hat: 'futou', beard: '#2a2420' }));
add(56, counter);
add(44, () => plant(196, 46));
add(115, () => plant(10, 116));
add(54, () => person(228, 60, { robe: '#5b6f7a', dark: '#46565f', hat: 'chef', back: true }));
add(82, () => person(250, 84, { robe: '#5b6f7a', dark: '#46565f', hat: 'chef' }));
for (const [cx, cy, dishes] of tables) {
  add(cy - 9, () => benchBack(cx, cy));
  add(cy - 1, () => table(cx, cy, dishes));
  add(cy + 10, () => benchFront(cx, cy));
}
const sitBack = (x, cy, o) => add(cy - 2, () => person(x, cy - 2, { ...o, pose: 'sit' }));
const sitFront = (x, cy, o) => add(cy + 12, () => person(x, cy + 13, { ...o, pose: 'sit', back: true }));
sitBack(67, 62, { robe: '#5f7f8f', dark: '#4a6573', hat: 'futou' });
sitBack(78, 62, { robe: '#c06a5a', dark: '#9a5044', hat: 'lady' });
sitBack(116, 62, { robe: '#8a6a3a', dark: '#6e542c', hat: 'futou', beard: '#3a2a1a' });
sitFront(118, 62, { robe: '#3f6b5a', dark: '#2f5446', hat: 'hu' });
sitBack(155, 62, { robe: '#4f4a42', dark: '#3a3630', hat: 'rough' });
sitBack(166, 62, { robe: '#6e5a3e', dark: '#56462e', hat: 'rough', flip: true });
sitBack(72, 96, { robe: '#8e2f2a', dark: '#6e2420', hat: 'official', trim: C.gold });
sitFront(76, 96, { robe: '#5a6a4a', dark: '#46543a', hat: 'bun' });
sitBack(111, 96, { robe: '#d58f86', dark: '#b4716a', hat: 'lady', flower: C.gold });
sitBack(121, 96, { robe: '#e6dcc5', dark: '#c8bca2', hat: 'futou', trim: '#4a6a8a' });
add(90, () => person(188, 90, { robe: '#6a5038', dark: '#523c28', hat: 'wrap', pose: 'tray', flip: true }));
add(117, () => person(34, 118, { robe: '#3e5a78', dark: '#2e4560', hat: 'wrap', pose: 'bow' }));
add(80, () => person(96, 82, { robe: '#5a4a3a', dark: '#46392c', hat: 'straw' }));
items.sort((a, b) => a.y - b.y).forEach((i) => i.fn());

partition();
front();

icon(78, 40, 'heart');
icon(160, 82, 'coin');
icon(96, 58, '!');

// 文字气泡放在界面层（像素画布上写不了这么小的字）
function say(lx, ly, text, shift = 0) {
  const el = document.createElement('div');
  el.className = 'say';
  el.textContent = text;
  document.getElementById('hud').appendChild(el);
  const w = el.offsetWidth, h = el.offsetHeight;
  const left = lx * S - w / 2 + shift;
  el.style.left = `${left}px`;
  el.style.top = `${ly * S - h - 9}px`;
  el.style.setProperty('--tail', `${lx * S - left - 3}px`);
}
say(116, 44, '听说城南米价又涨了…', 40);
say(166, 44, '小二！再来一壶！', 34);
say(34, 98, '客官里面请～', 30);

ready();
