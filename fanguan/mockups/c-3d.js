// 样张 C：3D 低多边形，正交相机等距视角。布局与样张 A 相同，方便对比。
// 坐标：X = 样张 A 的 x，Z = 样张 A 的 y，Y 向上。1 单位 = 1 米。
import * as THREE from 'three';
import { rng, shade, paperOverlay, bubble, ready } from './common.js';

const W = 844, H = 390;
const dpr = window.devicePixelRatio || 1;
await document.fonts.load('40px "Ma Shan Zheng"');
await document.fonts.load('600 20px "Noto Serif SC"');

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(dpr);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#d2b07e');

// 正交相机：方位 45°，俯角约 30°（和 2:1 等距图一致）
const VIEW_W = 26.5, VIEW_H = (VIEW_W * H) / W;
const camera = new THREE.OrthographicCamera(-VIEW_W / 2, VIEW_W / 2, VIEW_H / 2, -VIEW_H / 2, 0.1, 200);
const target = new THREE.Vector3(5.9, 0.6, 2.6);
camera.position.copy(target).add(new THREE.Vector3(30, 24.5, 30));
camera.lookAt(target);

scene.add(new THREE.HemisphereLight('#fff1d6', '#8a6a48', 1.3));
const sun = new THREE.DirectionalLight('#ffd7a0', 2.6);
sun.position.set(-6, 16, 0);
sun.target.position.set(5, 0, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

const F = 0.22;
const mats = new Map();
function mat(c, o = {}) {
  const key = c + JSON.stringify(o);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0, flatShading: true, ...o }));
  return mats.get(key);
}
function add(mesh, shadow = true) {
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}
// 与样张 A 相同的参数顺序：(x, y, z) 是最小角，w/d/h 是 x/y/z 方向的尺寸
function B(x, y, z, w, d, h, c, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || mat(c));
  mesh.position.set(x + w / 2, z + h / 2, y + d / 2);
  return add(mesh);
}
function Cyl(x, y, z, r, h, c, seg = 12, r2) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 ?? r, h, seg), mat(c));
  mesh.position.set(x, z + h / 2, y);
  return add(mesh);
}
function tex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
// 贴在墙上的平面。normal: 'z'（朝 +Z，后墙内侧/正面）或 'x'（朝 +X，左墙内侧）
function decal(t, x, y, z, w, h, normal = 'z') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, transparent: true }));
  if (normal === 'x') {
    m.rotation.y = Math.PI / 2;
    m.position.set(x, z + h / 2, y);
  } else {
    m.position.set(x + w / 2, z + h / 2, y);
  }
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

const latticeTex = tex(128, 128, (g, w, h) => {
  g.fillStyle = '#f4e9cf';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#5b3a24';
  g.lineWidth = 5;
  for (let i = 1; i < 5; i++) {
    g.beginPath();
    g.moveTo((w * i) / 5, 0);
    g.lineTo((w * i) / 5, h);
    g.moveTo(0, (h * i) / 5);
    g.lineTo(w, (h * i) / 5);
    g.stroke();
  }
  g.lineWidth = 12;
  g.strokeRect(0, 0, w, h);
});

// ---------- 地面 ----------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({
    roughness: 1,
    map: tex(512, 512, (g, w, h) => {
      g.fillStyle = '#d6b583';
      g.fillRect(0, 0, w, h);
      const r = rng(3);
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = r() < 0.5 ? 'rgba(120,85,45,0.12)' : 'rgba(255,245,220,0.15)';
        g.fillRect(r() * w, r() * h, 2, 2);
      }
    }),
  }),
);
ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
ground.material.map.repeat.set(8, 8);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
for (const [x, y, w, d] of [[-14, 7.7, 40, 2.7], [10.7, -14, 2.5, 30]]) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: '#e9d4aa', roughness: 1, transparent: true, opacity: 0.5 }));
  s.rotation.x = -Math.PI / 2;
  s.position.set(x + w / 2, 0.005, y + d / 2);
  s.receiveShadow = true;
  scene.add(s);
}

// ---------- 邻居房子 ----------
const tileTex = tex(64, 64, (g, w, h) => {
  g.fillStyle = '#4c5157';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#2f3338';
  g.fillRect(0, 0, w * 0.28, h);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(w * 0.55, 0, w * 0.12, h);
});
tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;

function roof(x, y, w, d, wallH, rise, over) {
  const ym = y + d / 2;
  const half = d / 2 + over;
  const len = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  for (const side of [-1, 1]) {
    const t = tileTex.clone();
    t.needsUpdate = true;
    t.repeat.set((w + over * 2) * 3, 1);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w + over * 2, 0.1, len), [
      mat('#3a3e44'), mat('#3a3e44'), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), mat('#3a3e44'), mat('#3a3e44'), mat('#3a3e44'),
    ]);
    slab.position.set(x + w / 2, wallH + rise / 2 + 0.1, ym + (side * half) / 2);
    slab.rotation.x = side * ang;
    add(slab);
  }
  B(x - over - 0.05, ym - 0.12, wallH + rise, w + over * 2 + 0.1, 0.24, 0.22, '#2b2a2c');
  // 脊端起翘
  for (const ex of [x - over - 0.05, x + w + over + 0.05]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), mat('#2b2a2c'));
    horn.position.set(ex, wallH + rise + 0.45, ym);
    horn.rotation.z = ex < x ? 0.5 : -0.5;
    add(horn);
  }
  // 山墙三角
  const tri = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, rise)]);
  for (const ex of [x, x + w]) {
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(tri), mat('#cdbb98', { side: THREE.DoubleSide }));
    gable.rotation.y = Math.PI / 2;
    gable.position.set(ex, wallH, ym);
    add(gable);
  }
}
function neighbor(x, y, w, d, h) {
  B(x, y, 0, w, d, 0.25, '#b9a888');
  B(x, y, 0.25, w, d, h - 0.25, '#e2d4b6');
  for (let k = 0; k <= 3; k++) B(x + (w / 3) * k - 0.1, y + d - 0.02, 0.25, 0.2, 0.12, h - 0.25, '#5b3a24');
  for (let k = 0; k < 3; k++) decal(latticeTex, x + (w / 3) * k + 0.35, y + d + 0.02, h - 1.8, w / 3 - 0.7, 1.3);
  B(x, y + d - 0.02, 0.25, w, 0.06, 0.75, '#6e4a2e');
  roof(x, y, w, d, h, 1.7, 0.55);
}
neighbor(-8.5, -1.5, 6.2, 5.5, 3.0);
neighbor(12.6, -9, 5, 5.2, 3.2);

// ---------- 树 ----------
function tree(x, y, c, seed, scale = 1) {
  const r = rng(seed);
  Cyl(x, y, 0, 0.12 * scale, 2.4 * scale, '#5a3d27', 7, 0.18 * scale);
  for (let i = 0; i < 9; i++) {
    const s = (0.55 + r() * 0.5) * scale;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat(shade(c, (r() - 0.5) * 0.25)));
    m.position.set(x + (r() - 0.5) * 1.6 * scale, (2.3 + r() * 1.3) * scale, y + (r() - 0.5) * 1.6 * scale);
    m.rotation.set(r() * 3, r() * 3, 0);
    add(m);
  }
}
tree(11.7, -1.6, '#e2b64a', 21, 1.15);
tree(-3.6, 8.4, '#e7a7a7', 5, 0.85);
{
  const r = rng(9);
  for (let i = 0; i < 60; i++) {
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.06, 5), mat(r() < 0.5 ? '#e2b64a' : '#d39a32'));
    leaf.rotation.x = -Math.PI / 2;
    leaf.position.set(11.7 + (r() - 0.3) * 5, 0.01, -1.6 + (r() - 0.2) * 6);
    scene.add(leaf);
  }
}

// ---------- 饭馆外壳 ----------
B(-0.3, -0.3, 0, 10.6, 7.6, F, '#c9b896');
{
  const planks = tex(512, 360, (g, w, h) => {
    g.fillStyle = '#a5764b';
    g.fillRect(0, 0, w, h);
    const r = rng(2);
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,230,190,0.07)' : 'rgba(60,30,10,0.07)';
      g.fillRect(0, y, w, 16);
      g.fillStyle = 'rgba(70,40,18,0.45)';
      g.fillRect(0, y, w, 1.5);
      for (let x = r() * 60; x < w; x += 60 + r() * 50) g.fillRect(x, y, 1.5, 16);
    }
  });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshStandardMaterial({ map: planks, roughness: 0.75 }));
  fl.rotation.x = -Math.PI / 2;
  fl.position.set(5, F + 0.002, 3.5);
  fl.receiveShadow = true;
  scene.add(fl);
}
B(0, -0.2, F, 10, 0.2, 3.0, '#ebdfc4');
B(-0.2, -0.2, F, 0.2, 7.2, 3.0, '#ebdfc4');
B(0, 0, F, 10, 0.04, 0.95, '#7a5232');
B(0, 0, F, 0.04, 7, 0.95, '#7a5232');
B(0, -0.2, F + 2.88, 10, 0.3, 0.14, '#5b3a24');
B(-0.2, 0, F + 2.88, 0.3, 7, 0.14, '#5b3a24');
for (const t of [2.5, 5, 7.5]) B(t - 0.08, 0, F, 0.16, 0.06, 3, '#5b3a24');
B(0, 3.42, F, 0.06, 0.16, 3, '#5b3a24');
decal(latticeTex, 0.7, 0.05, F + 1.25, 1.2, 1.2);
decal(latticeTex, 3.0, 0.05, F + 1.25, 1.4, 1.2);
decal(
  tex(64, 140, (g, w, h) => {
    g.fillStyle = '#efe6cf';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6a4a2e';
    g.lineWidth = 6;
    g.strokeRect(0, 0, w, h);
    g.fillStyle = 'rgba(70,80,80,0.5)';
    g.beginPath();
    g.moveTo(8, 110);
    g.lineTo(22, 50);
    g.lineTo(34, 80);
    g.lineTo(46, 35);
    g.lineTo(58, 110);
    g.fill();
  }),
  5.55, 0.05, F + 1.0, 0.7, 1.5,
);
// 菜牌
{
  const dishes = ['红烧肉', '糖醋鱼', '东坡肘', '桂花糕', '阳春面', '女儿红'];
  const t = tex(6 * 64, 220, (g) => {
    dishes.forEach((d, i) => {
      g.fillStyle = i === 5 ? '#a8342a' : '#3b2618';
      g.fillRect(i * 64 + 6, 0, 52, 220);
      g.fillStyle = '#ecd9a8';
      g.font = '600 40px "Noto Serif SC"';
      g.textAlign = 'center';
      [...d].forEach((ch, k) => g.fillText(ch, i * 64 + 32, 58 + k * 64));
    });
  });
  // 朝 +X 的平面：贴图左边在 +Z 一侧，屏幕上也在左边，直接贴就是从左往右读
  decal(t, 0.03, 3.35, F + 1.6, 2.25, 1.05, 'x');
}
// 酒架
B(0, 4.9, F + 1.35, 0.3, 1.8, 0.06, '#5b3a24');
B(0, 4.9, F + 2.0, 0.3, 1.8, 0.06, '#5b3a24');
for (let i = 0; i < 5; i++) {
  for (const lv of [1.41, 2.06]) {
    Cyl(0.15, 5.05 + i * 0.36, F + lv, 0.1, 0.24, '#6a3a22', 8, 0.08);
    Cyl(0.15, 5.05 + i * 0.36, F + lv + 0.24, 0.06, 0.04, '#c23a2c', 8);
  }
}

// ---------- 厨房 ----------
B(7.0, 0.15, F, 2.7, 1.0, 0.85, '#9a5a3c');
B(6.98, 0.13, F + 0.85, 2.74, 1.04, 0.05, '#b98a66');
for (const [wx, food] of [[7.65, '#b5532b'], [8.95, '#d9c37a']]) {
  const wok = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#2b2622', { side: THREE.DoubleSide }));
  wok.position.set(wx, F + 1.02, 0.65);
  add(wok);
  Cyl(wx, 0.65, F + 0.84, 0.2, 0.06, food, 12);
  // 灶口火光
  const fire = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#ffb04a' }));
  fire.position.set(wx, F + 0.22, 1.16);
  scene.add(fire);
  const fl = new THREE.PointLight('#ff8a3a', 1.6, 2.2, 2);
  fl.position.set(wx, F + 0.4, 1.5);
  scene.add(fl);
}
B(9.35, 0.0, F + 0.85, 0.35, 0.35, 2.15, '#8a5038');
Cyl(6.85, 0.55, F, 0.32, 0.7, '#4c4038', 14);
Cyl(6.85, 0.55, F + 0.7, 0.28, 0.01, '#5d8c94', 14);
B(7.4, 2.5, F, 2.6, 0.18, 1.0, '#e2d4b6');
B(7.4, 2.5, F + 1.0, 2.6, 0.24, 0.05, '#8b6a48');
B(6.5, 0.0, F, 0.15, 1.3, 1.0, '#e2d4b6');
B(9.05, 1.5, F, 0.8, 0.6, 0.78, '#8a6440');
Cyl(9.3, 1.75, F + 0.78, 0.13, 0.16, '#6f9a3a', 8);
for (let i = 0; i < 6; i++) B(6.9 + i * 0.26, 0.0, F + 1.9, 0.18, 0.12, 0.1, i % 2 ? '#e9e2d0' : '#7d9aa0');
B(6.9, 0.0, F + 1.86, 1.6, 0.16, 0.04, '#6b4a2e');
{
  const steamM = new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, opacity: 0.22, depthWrite: false });
  for (const wx of [7.65, 8.95]) {
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.16 + i * 0.05, 10, 8), steamM);
      s.position.set(wx + Math.sin(i * 1.4) * 0.12, F + 1.25 + i * 0.25, 0.65);
      scene.add(s);
    }
  }
}

// ---------- 柜台、酒坛、桌凳 ----------
B(1.0, 2.2, F, 0.7, 2.3, 1.0, '#6b3d22');
B(0.97, 2.17, F + 1.0, 0.76, 2.36, 0.06, '#4a2a17');
B(1.15, 2.75, F + 1.06, 0.3, 0.5, 0.06, '#3b2213');
B(1.15, 3.6, F + 1.06, 0.3, 0.4, 0.03, '#eadcb8');
function jar(x, y, s = 1) {
  const pts = [[0, 0], [0.18, 0], [0.27, 0.2], [0.26, 0.42], [0.14, 0.58], [0.15, 0.64], [0, 0.64]].map(([r, h]) => new THREE.Vector2(r * s, h * s));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), mat('#6a3a22', { roughness: 0.45 }));
  m.position.set(x, F, y);
  add(m);
  Cyl(x, y, F + 0.62 * s, 0.17 * s, 0.06, '#d1452f', 12);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.18 * s, 0.18 * s), mat('#c23a2c'));
  label.position.set(x + 0.19 * s, F + 0.36 * s, y + 0.19 * s);
  label.rotation.y = Math.PI / 4;
  scene.add(label);
}
jar(0.42, 5.2);
jar(0.42, 5.9);
jar(0.42, 6.6);
jar(1.05, 6.45, 0.85);

const tables = [
  { x: 3.1, y: 2.0, dishes: [[-0.2, -0.15, '#b5532b'], [0.2, 0.15, '#6f9a3a']], jug: true },
  { x: 5.2, y: 2.0, dishes: [[-0.15, 0.1, '#d9c37a']], jug: true },
  { x: 2.9, y: 4.6, dishes: [[0, 0, '#a83a2a'], [0.25, -0.25, '#e8e0c8'], [-0.25, 0.2, '#6f9a3a']] },
  { x: 5.3, y: 4.7, dishes: [[-0.2, 0, '#c8742e'], [0.2, 0.2, '#6f9a3a']], jug: true },
  { x: 8.1, y: 4.4, dishes: [[0.1, -0.1, '#e8e0c8'], [-0.2, 0.25, '#e8e0c8']] },
];
for (const t of tables) {
  B(t.x - 0.55, t.y - 0.55, F + 0.72, 1.1, 1.1, 0.08, '#8a5530');
  for (const [dx, dy] of [[0.05, 0.05], [0.97, 0.05], [0.05, 0.97], [0.97, 0.97]]) B(t.x - 0.55 + dx, t.y - 0.55 + dy, F, 0.08, 0.08, 0.72, '#6e4024');
  for (const by of [-0.6, 0.6]) {
    B(t.x - 0.55, t.y + by - 0.13, F + 0.38, 1.1, 0.26, 0.07, '#8a5a34');
    for (const lx of [-0.5, 0.42]) B(t.x + lx, t.y + by - 0.08, F, 0.08, 0.16, 0.38, '#6e4628');
  }
  for (const [dx, dy, food] of t.dishes) {
    Cyl(t.x + dx, t.y + dy, F + 0.8, 0.13, 0.025, '#f4efe2', 14);
    Cyl(t.x + dx, t.y + dy, F + 0.825, 0.085, 0.03, food, 10);
  }
  if (t.jug) {
    const pts = [[0, 0], [0.07, 0], [0.09, 0.08], [0.05, 0.18], [0.03, 0.22], [0, 0.22]].map(([r, h]) => new THREE.Vector2(r, h));
    const jug = new THREE.Mesh(new THREE.LatheGeometry(pts, 10), mat('#5e7f86', { roughness: 0.4 }));
    jug.position.set(t.x + 0.25, F + 0.8, t.y - 0.2);
    add(jug);
  }
}
function plant(x, y) {
  Cyl(x, y, F, 0.22, 0.35, '#5e7f86', 10, 0.17);
  const r = rng(x * 100 + y);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + r() * 0.08, 0), mat('#5d8a45'));
    m.position.set(x + (r() - 0.5) * 0.3, F + 0.5 + r() * 0.35, y + (r() - 0.5) * 0.3);
    add(m);
  }
}
plant(0.5, 0.5);
plant(9.55, 3.15);

// ---------- 人物 ----------
const SKIN = '#ecc9a2', HAIR = '#1f1a17';
const UP = new THREE.Vector3(0, 1, 0);
function limb(g, a, b, r, m) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.35, dir.length(), 7), m);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
  mesh.castShadow = true;
  g.add(mesh);
}
function person(x, y, opt) {
  const g = new THREE.Group();
  const sit = opt.pose === 'sit';
  const base = (opt.z ?? F) + (sit ? 0.45 : 0);
  const robeM = mat(opt.robe), trimM = mat(opt.trim || shade(opt.robe, -0.35)), skinM = mat(SKIN), hairM = mat(HAIR);
  const prof = sit
    ? [[0, 0], [0.2, 0], [0.21, 0.25], [0.18, 0.55], [0.13, 0.66], [0, 0.68]]
    : [[0, 0], [0.25, 0.02], [0.22, 0.45], [0.18, 0.92], [0.16, 1.14], [0.11, 1.22], [0, 1.24]];
  const robe = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), 10), robeM);
  robe.position.y = base;
  robe.castShadow = true;
  g.add(robe);
  const top = base + (sit ? 0.68 : 1.24);
  if (sit) {
    const th = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.15, 0.42), robeM);
    th.position.set(0, base + 0.07, 0.17);
    g.add(th);
  }
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(sit ? 0.195 : 0.18, sit ? 0.2 : 0.185, 0.06, 10), trimM);
  belt.position.y = top - 0.32;
  g.add(belt);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.02), mat('#f3ead6'));
  collar.position.set(0.03, top - 0.12, 0.15);
  collar.rotation.z = 0.5;
  g.add(collar);
  // 手臂
  const sleeve = mat(shade(opt.robe, -0.12));
  const hands = {
    stand: [[-0.24, -0.5, 0.05], [0.24, -0.5, 0.05]],
    sit: [[-0.14, -0.36, 0.28], [0.14, -0.36, 0.28]],
    tray: [[-0.13, -0.3, 0.32], [0.13, -0.3, 0.32]],
    bow: [[-0.03, -0.32, 0.22], [0.03, -0.32, 0.22]],
    cook: [[-0.16, -0.35, 0.3], [0.2, -0.25, 0.34]],
    abacus: [[-0.14, -0.38, 0.3], [0.14, -0.38, 0.3]],
    pole: [[-0.22, 0.02, 0.0], [0.22, 0.02, 0.0]],
    walk: [[-0.22, -0.48, 0.12], [0.22, -0.48, -0.1]],
  }[opt.pose || 'stand'];
  for (const [i, side] of [[0, -1], [1, 1]]) {
    const a = new THREE.Vector3(side * 0.17, top - 0.05, 0);
    const b = new THREE.Vector3(hands[i][0], top + hands[i][1], hands[i][2]);
    limb(g, a, b, 0.06, sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), skinM);
    hand.position.copy(b);
    g.add(hand);
  }
  if (opt.pose === 'tray') {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 12), mat('#6b3f22'));
    tray.position.set(0, top - 0.28, 0.36);
    g.add(tray);
    for (const [dx, c] of [[-0.1, '#b8442a'], [0.1, '#6f9a3a']]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 10), mat(c));
      p.position.set(dx, top - 0.25, 0.38);
      g.add(p);
    }
  }
  if (opt.pose === 'pole') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), mat('#7a5530'));
    pole.rotation.z = Math.PI / 2;
    pole.position.set(0, top + 0.02, 0);
    g.add(pole);
    for (const side of [-1, 1]) {
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.25, 10), mat('#b48a52'));
      basket.position.set(side * 0.7, base + 0.35, 0);
      g.add(basket);
      const goods = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(side < 0 ? '#5f8a3a' : '#c7742e'));
      goods.position.set(side * 0.7, base + 0.5, 0);
      g.add(goods);
      limb(g, new THREE.Vector3(side * 0.7, top, 0), new THREE.Vector3(side * 0.7, base + 0.48, 0), 0.008, mat('#5a4030'));
    }
  }
  // 头
  const hy = top + 0.15;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), skinM);
  head.position.y = hy;
  head.castShadow = true;
  g.add(head);
  for (const ex of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 5, 4), mat('#1a120c'));
    eye.position.set(ex, hy + 0.01, 0.125);
    g.add(eye);
  }
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.142, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), hairM);
  hair.position.y = hy;
  hair.rotation.x = -0.45;
  g.add(hair);
  const at = (geo, m, px, py, pz, rx = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(px, hy + py, pz);
    mesh.rotation.set(rx, 0, rz);
    mesh.castShadow = true;
    g.add(mesh);
    return mesh;
  };
  const black = mat('#161311');
  switch (opt.hat) {
    case 'futou':
      at(new THREE.SphereGeometry(0.15, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), black, 0, 0.03, -0.01);
      at(new THREE.SphereGeometry(0.09, 8, 6), black, 0, 0.17, -0.03);
      break;
    case 'official':
      at(new THREE.BoxGeometry(0.28, 0.2, 0.26), black, 0, 0.13, -0.01);
      at(new THREE.BoxGeometry(0.85, 0.025, 0.04), black, 0, 0.17, -0.12);
      break;
    case 'straw':
      at(new THREE.ConeGeometry(0.36, 0.2, 14), mat('#c7a568'), 0, 0.15, 0);
      break;
    case 'wrap':
      at(new THREE.SphereGeometry(0.15, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#f1ece0'), 0, 0.03, -0.01);
      break;
    case 'chef':
      at(new THREE.CylinderGeometry(0.15, 0.13, 0.2, 10), mat('#f4f0e6'), 0, 0.17, -0.01);
      break;
    case 'lady':
      at(new THREE.SphereGeometry(0.075, 8, 6), hairM, -0.1, 0.14, -0.03);
      at(new THREE.SphereGeometry(0.075, 8, 6), hairM, 0.1, 0.14, -0.03);
      at(new THREE.SphereGeometry(0.03, 6, 4), mat(opt.flower || '#d4513f'), 0.14, 0.1, 0.05);
      break;
    case 'hu':
      at(new THREE.ConeGeometry(0.15, 0.36, 10), mat('#5e4630'), 0, 0.22, -0.01);
      at(new THREE.TorusGeometry(0.135, 0.025, 6, 14), mat('#2f6b6a'), 0, 0.05, 0, Math.PI / 2);
      break;
    case 'rough':
      at(new THREE.TorusGeometry(0.135, 0.022, 6, 14), mat('#b23a2a'), 0, 0.05, 0, Math.PI / 2);
      break;
    default:
      at(new THREE.SphereGeometry(0.07, 8, 6), hairM, 0, 0.16, -0.02);
  }
  if (opt.beard) at(new THREE.ConeGeometry(0.05, 0.14, 6), mat(opt.beard), 0, -0.14, 0.09, Math.PI);
  g.position.set(x, 0, y);
  // 朝向：0 = 朝 +Z（朝镜头偏左），π/2 = 朝 +X（朝镜头偏右）
  g.rotation.y = opt.face ?? Math.PI / 4;
  scene.add(g);
  g.traverse((o) => o.isMesh && (o.castShadow = true));
  return g;
}

person(8.3, 1.6, { robe: '#5b6f7a', trim: '#33414a', hat: 'chef', pose: 'cook', face: Math.PI });
person(0.55, 3.35, { robe: '#475a6a', trim: '#2b3540', hat: 'futou', pose: 'abacus', beard: '#2a2420', face: Math.PI / 2 });
person(3.1, 1.4, { robe: '#5f7f8f', trim: '#2f4450', hat: 'futou', pose: 'sit', face: 0 });
person(3.1, 2.6, { robe: '#c06a5a', trim: '#7a3a2e', hat: 'lady', pose: 'sit', face: Math.PI });
person(4.95, 1.4, { robe: '#4f4a42', trim: '#2a2622', hat: 'rough', pose: 'sit', face: 0 });
person(5.45, 1.4, { robe: '#6e5a3e', trim: '#3a2e1e', hat: 'rough', pose: 'sit', face: 0 });
person(2.9, 4.0, { robe: '#8e2f2a', trim: '#c9a24a', hat: 'official', pose: 'sit', face: 0 });
person(5.05, 4.1, { robe: '#8a6a3a', trim: '#4a3418', hat: 'futou', pose: 'sit', face: 0 });
person(5.55, 5.3, { robe: '#3f6b5a', trim: '#c9a24a', hat: 'hu', beard: '#6a4a2a', pose: 'sit', face: Math.PI });
person(6.85, 3.0, { robe: '#6a5038', trim: '#3b2a1c', hat: 'wrap', pose: 'tray', face: -Math.PI / 4 });
person(2.95, 3.2, { robe: '#5a4a3a', trim: '#2a2016', hat: 'straw', pose: 'walk', face: Math.PI / 3 });
person(3.45, 7.3, { robe: '#3e5a78', trim: '#24364a', hat: 'wrap', pose: 'bow', face: Math.PI / 2 });

// ---------- 前沿：柱、栏杆、入口、灯笼 ----------
function column(x, y) {
  Cyl(x, y, F, 0.19, 0.22, '#b7a98c', 8);
  Cyl(x, y, F + 0.22, 0.12, 2.8, '#8e3326', 10);
}
function railing(axis, fixed, a0, a1) {
  for (let t = a0 + 0.15; t < a1; t += 0.32) {
    axis === 'x' ? B(t, fixed - 0.03, F, 0.06, 0.06, 0.55, '#6e4628') : B(fixed - 0.03, t, F, 0.06, 0.06, 0.55, '#6e4628');
  }
  if (axis === 'x') {
    B(a0, fixed - 0.06, F + 0.55, a1 - a0, 0.12, 0.08, '#6e4628');
    B(a0, fixed - 0.06, F, a1 - a0, 0.12, 0.1, '#5b3a24');
  } else {
    B(fixed - 0.06, a0, F + 0.55, 0.12, a1 - a0, 0.08, '#6e4628');
    B(fixed - 0.06, a0, F, 0.12, a1 - a0, 0.1, '#5b3a24');
  }
}
railing('x', 7.0, 0, 2.85);
railing('x', 7.0, 5.55, 10);
railing('z', 10.0, 0, 7.0);
for (const [x, y] of [[0, 7], [10, 7], [10, 3.5], [10, 0], [3.0, 7], [5.4, 7]]) column(x, y);
B(3.1, 7.0, 0, 2.2, 0.55, F, '#c9b896');
B(3.1, 7.55, 0, 2.2, 0.3, F / 2, '#c9b896');
B(2.85, 6.94, F + 2.55, 2.8, 0.14, 0.24, '#5b3a24');
{
  const t = tex(340, 100, (g, w, h) => {
    g.fillStyle = '#2a1a10';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#3b2618';
    g.fillRect(6, 6, w - 12, h - 12);
    g.strokeStyle = '#c9a24a';
    g.lineWidth = 4;
    g.strokeRect(12, 12, w - 24, h - 24);
    g.fillStyle = '#ecc865';
    g.font = '64px "Ma Shan Zheng"';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('福来饭馆', w / 2, h / 2 + 4);
  });
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.06), [mat('#2a1a10'), mat('#2a1a10'), mat('#2a1a10'), mat('#2a1a10'), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), mat('#2a1a10')]);
  plaque.position.set(4.2, F + 2.28, 7.12);
  add(plaque);
}
function lantern(x, y, z) {
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: '#c8392b', emissive: '#ff5a24', emissiveIntensity: 0.9, roughness: 0.6 }));
  body.scale.y = 1.2;
  body.position.set(x, z, y);
  scene.add(body);
  Cyl(x, y, z + 0.2, 0.1, 0.06, '#2a1a10', 8);
  Cyl(x, y, z - 0.27, 0.1, 0.06, '#2a1a10', 8);
  Cyl(x, y, z - 0.5, 0.012, 0.22, '#e9b54a', 4);
  const l = new THREE.PointLight('#ffb066', 2.2, 3.5, 2);
  l.position.set(x, z - 0.1, y + 0.1);
  scene.add(l);
}
lantern(10, 1.75, F + 2.3);
lantern(10, 5.25, F + 2.3);
lantern(2.85, 7.0, F + 2.25);
lantern(5.55, 7.0, F + 2.25);

// ---------- 街上 ----------
{
  Cyl(-0.6, 7.6, 0, 0.04, 4.2, '#4a3020', 6);
  const arm = B(-1.5, 7.57, 3.95, 0.9, 0.06, 0.06, '#4a3020');
  arm.castShadow = true;
  const t = tex(120, 260, (g, w, h) => {
    g.fillStyle = '#f2e8d2';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#a8342a';
    g.lineWidth = 12;
    g.strokeRect(0, 0, w, h);
    g.fillStyle = '#2a1a10';
    g.font = '96px "Ma Shan Zheng"';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('酒', w / 2, h / 2);
  });
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.3), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.9 }));
  flag.position.set(-1.15, 3.3, 7.6);
  flag.castShadow = true;
  scene.add(flag);
}
B(0.0, 10.15, 0, 1.2, 0.7, 0.75, '#8a6440');
for (const [dx, dy] of [[-0.3, -0.05], [0.05, 0.05], [0.35, -0.08]]) {
  Cyl(0.6 + dx, 10.5 + dy, 0.75, 0.18, 0.22, '#c8a26a', 12);
  Cyl(0.6 + dx, 10.5 + dy, 0.97, 0.18, 0.1, '#efe6d2', 12);
}
person(0.6, 9.95, { robe: '#7a5a3a', trim: '#3b2a1c', hat: 'bun', z: 0, face: Math.PI / 4 });
Cyl(0.6, 10.5, 0, 0.03, 2.5, '#4a3020', 6);
{
  const um = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.45, 16, 1, true), mat('#5f8f93', { side: THREE.DoubleSide }));
  um.position.set(0.6, 2.4, 10.5);
  add(um);
}
person(4.3, 8.05, { robe: '#e6dcc5', trim: '#4a6a8a', hat: 'futou', z: 0, pose: 'walk', face: Math.PI + 0.3 });
person(8.0, 8.9, { robe: '#7b6a4c', trim: '#3e3424', hat: 'straw', pose: 'pole', z: 0, face: Math.PI / 2 });
person(1.4, 8.8, { robe: '#d58f86', trim: '#7a3a2e', hat: 'lady', pose: 'walk', z: 0, face: Math.PI / 2, flower: '#f0d060' });
person(13.6, 4.2, { robe: '#5a6a4a', trim: '#2f3826', hat: 'bun', pose: 'walk', z: 0, face: Math.PI });

renderer.render(scene, camera);

// ---------- 纸张质感与气泡（2D 叠加层） ----------
function overlay(id) {
  const cv = document.getElementById(id);
  cv.width = W * dpr;
  cv.height = H * dpr;
  const g = cv.getContext('2d');
  g.scale(dpr, dpr);
  return g;
}
paperOverlay(overlay('fx'), W, H, 4, 0.75);
const ui = overlay('ui');
const toScreen = (x, y, z) => {
  const v = new THREE.Vector3(x, z, y).project(camera);
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
};
{
  const [ax, ay] = toScreen(5.05, 4.1, F + 1.5);
  bubble(ui, ax, ay, '听说城南米价又涨了…', { dx: 52 });
  const [bx, by] = toScreen(5.45, 1.4, F + 1.5);
  bubble(ui, bx, by - 18, '小二！再来一壶！', { dx: 40 });
  const [cx, cy] = toScreen(3.45, 7.3, F + 1.75);
  bubble(ui, cx, cy, '客官里面请～', { dx: -40 });
  const [dx, dy] = toScreen(8.1, 4.4, F + 1.1);
  ui.save();
  ui.fillStyle = 'rgba(42,26,14,0.82)';
  ui.beginPath();
  ui.roundRect(dx - 22, dy - 12, 50, 20, 10);
  ui.fill();
  ui.fillStyle = '#e2b13e';
  ui.beginPath();
  ui.arc(dx - 11, dy - 2, 7.5, 0, Math.PI * 2);
  ui.fill();
  ui.fillStyle = '#5a3a14';
  ui.fillRect(dx - 13, dy - 4, 4, 4);
  ui.fillStyle = '#f6d98a';
  ui.font = '600 13px "Noto Serif SC", serif';
  ui.textBaseline = 'middle';
  ui.fillText('+38', dx - 1, dy - 1.5);
  ui.restore();
}

ready();
