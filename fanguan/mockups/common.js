// 样张共用的绘图工具：颜色、随机数、纸张质感、古装小人、对话气泡。
// 这些只是示意图，不是游戏代码。

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// amt > 0 提亮（混白），amt < 0 压暗（混一点暖黑，不发灰）
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt > 0 ? [255, 250, 240] : [40, 24, 14];
  const k = Math.abs(amt);
  const m = (c, i) => Math.round(c + (t[i] - c) * k);
  return `rgb(${m(r, 0)},${m(g, 1)},${m(b, 2)})`;
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// 纸张/绢本质感：细噪点 + 大块浅斑 + 四角压暗。画在最上层。
export function paperOverlay(ctx, w, h, seed = 7, strength = 1) {
  const r = rng(seed);
  const n = document.createElement('canvas');
  n.width = 256;
  n.height = 256;
  const nc = n.getContext('2d');
  const img = nc.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 200 + r() * 55;
    img.data[i] = v;
    img.data[i + 1] = v * 0.97;
    img.data[i + 2] = v * 0.9;
    img.data[i + 3] = 255;
  }
  nc.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.18 * strength;
  ctx.fillStyle = ctx.createPattern(n, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.1 * strength;
  for (let i = 0; i < 14; i++) {
    const x = r() * w, y = r() * h, rad = 60 + r() * 160;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(150,110,60,0.6)');
    g.addColorStop(1, 'rgba(150,110,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = 0.55 * strength;
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(90,60,30,0)');
  v.addColorStop(1, 'rgba(90,60,30,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

const SKIN = '#ecc9a2';
const HAIR = '#1f1a17';
const INK = 'rgba(52,34,20,0.55)';

// 古装小人。脚底在 (x, y)，s 是站立时的身高（像素）。
// opt: robe 衣色, trim 镶边/腰带, hat 帽子, facing 1 朝右 / -1 朝左,
//      pose: stand | sit | walk | tray | cook | fan | abacus | pole | bow
export function drawPerson(ctx, x, y, s, opt = {}) {
  const u = s / 44;
  const robe = opt.robe || '#6d8a9a';
  const trim = opt.trim || shade(robe, -0.35);
  const facing = opt.facing || 1;
  const pose = opt.pose || 'stand';
  const sit = pose === 'sit';
  const lift = sit ? 9 * u : 0; // 坐下时上半身下沉

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (!opt.noShadow) {
    ctx.fillStyle = 'rgba(70,45,20,0.22)';
    ctx.beginPath();
    ctx.ellipse(1 * u, -0.5 * u, (sit ? 11 : 9) * u, 3 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 挑担：扁担和两个筐（画在身后）
  if (pose === 'pole') {
    ctx.strokeStyle = '#7a5530';
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.moveTo(-16 * u, -30 * u);
    ctx.lineTo(16 * u, -31 * u);
    ctx.stroke();
    for (const bx of [-15, 15]) {
      ctx.strokeStyle = 'rgba(80,55,30,0.8)';
      ctx.lineWidth = 0.7 * u;
      ctx.beginPath();
      ctx.moveTo(bx * u, -30 * u);
      ctx.lineTo((bx - 4) * u, -12 * u);
      ctx.moveTo(bx * u, -30 * u);
      ctx.lineTo((bx + 4) * u, -12 * u);
      ctx.stroke();
      ctx.fillStyle = '#b48a52';
      ctx.beginPath();
      ctx.ellipse(bx * u, -12 * u, 5.5 * u, 2.2 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect((bx - 5.5) * u, -12 * u, 11 * u, 6 * u);
      ctx.fillStyle = '#8a6438';
      ctx.beginPath();
      ctx.ellipse(bx * u, -6 * u, 5.5 * u, 2 * u, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = bx < 0 ? '#5f8a3a' : '#c7742e';
      ctx.beginPath();
      ctx.ellipse(bx * u, -13 * u, 4.6 * u, 1.8 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 下摆 / 腿
  ctx.fillStyle = trim;
  if (!sit) {
    const step = pose === 'walk' || pose === 'pole' ? 2.5 : 0;
    ctx.beginPath();
    ctx.ellipse((-3 - step) * u, -1 * u, 2.6 * u, 1.4 * u, 0, 0, Math.PI * 2);
    ctx.ellipse((3 + step) * u, -1.4 * u, 2.6 * u, 1.4 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 袍身
  ctx.fillStyle = robe;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.6 * u;
  ctx.beginPath();
  if (sit) {
    ctx.moveTo(-4 * u, -31 * u + lift);
    ctx.lineTo(-7 * u, -29 * u + lift);
    ctx.lineTo(-8.5 * u, -12 * u);
    ctx.quadraticCurveTo(-9 * u, -3 * u, -2 * u, -3 * u);
    ctx.lineTo(10 * u, -3.5 * u);
    ctx.quadraticCurveTo(12 * u, -8 * u, 8 * u, -12 * u);
    ctx.lineTo(7 * u, -29 * u + lift);
    ctx.lineTo(4 * u, -31 * u + lift);
  } else {
    ctx.moveTo(-4 * u, -31 * u);
    ctx.lineTo(-7.2 * u, -29 * u);
    ctx.quadraticCurveTo(-8 * u, -14 * u, -9 * u, -2.5 * u);
    ctx.quadraticCurveTo(0, -1 * u, 9 * u, -2.5 * u);
    ctx.quadraticCurveTo(8 * u, -14 * u, 7.2 * u, -29 * u);
    ctx.lineTo(4 * u, -31 * u);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 衣褶的浅暗面
  ctx.fillStyle = 'rgba(40,24,10,0.14)';
  ctx.beginPath();
  if (sit) {
    ctx.moveTo(2 * u, -18 * u + lift);
    ctx.lineTo(7.5 * u, -28 * u + lift);
    ctx.lineTo(8 * u, -12 * u);
    ctx.lineTo(10 * u, -4 * u);
    ctx.lineTo(4 * u, -4 * u);
  } else {
    ctx.moveTo(2.5 * u, -20 * u);
    ctx.lineTo(7.2 * u, -29 * u);
    ctx.quadraticCurveTo(8 * u, -14 * u, 9 * u, -2.5 * u);
    ctx.lineTo(3.5 * u, -2 * u);
  }
  ctx.closePath();
  ctx.fill();

  const top = -31 * u + lift;
  // 交领
  ctx.strokeStyle = '#f3ead6';
  ctx.lineWidth = 1.3 * u;
  ctx.beginPath();
  ctx.moveTo(-3.2 * u, top + 0.3 * u);
  ctx.lineTo(2.6 * u, top + 8.5 * u);
  ctx.moveTo(3.2 * u, top + 0.3 * u);
  ctx.lineTo(0.2 * u, top + 4.5 * u);
  ctx.stroke();
  // 腰带
  ctx.fillStyle = trim;
  ctx.fillRect(-7.3 * u, top + 11 * u, 14.6 * u, 2.2 * u);

  // 手臂 / 袖子
  const sleeve = shade(robe, -0.12);
  const arm = (ax, ay, bx, by, hand = true) => {
    ctx.strokeStyle = sleeve;
    ctx.lineWidth = 4.2 * u;
    ctx.beginPath();
    ctx.moveTo(ax * u, ay * u + lift);
    ctx.lineTo(bx * u, by * u + lift);
    ctx.stroke();
    if (hand) {
      ctx.fillStyle = SKIN;
      ctx.beginPath();
      ctx.arc(bx * u, by * u + lift, 1.5 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  if (pose === 'tray') {
    arm(-6, -27, 4, -21);
    arm(6, -27, 9, -21);
    ctx.fillStyle = '#6b3f22';
    ctx.beginPath();
    ctx.ellipse(7 * u, -22.5 * u, 7 * u, 2.4 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    const dishes = [['#f6f0e2', '#b8442a', 4.5], ['#f6f0e2', '#6f9a3a', 9.5]];
    for (const [plate, food, dx] of dishes) {
      ctx.fillStyle = plate;
      ctx.beginPath();
      ctx.ellipse(dx * u, -23.8 * u, 2.6 * u, 1.1 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = food;
      ctx.beginPath();
      ctx.ellipse(dx * u, -24.3 * u, 1.6 * u, 0.8 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (pose === 'cook') {
    arm(-6, -27, -3, -17);
    arm(6, -27, 12, -22);
    ctx.strokeStyle = '#3c2a1c';
    ctx.lineWidth = 1 * u;
    ctx.beginPath();
    ctx.moveTo(12 * u, -22 * u);
    ctx.lineTo(18 * u, -17 * u);
    ctx.stroke();
  } else if (pose === 'fan') {
    arm(-6, -27, -8, -17);
    arm(6, -27, 10, -36);
    ctx.fillStyle = '#efe2c2';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.5 * u;
    ctx.beginPath();
    ctx.moveTo(10 * u, -36 * u + lift);
    ctx.arc(10 * u, -36 * u + lift, 7 * u, -Math.PI * 0.95, -Math.PI * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (pose === 'abacus' || pose === 'sit') {
    arm(-6, -27, -3, -19);
    arm(6, -27, 5, -19);
  } else if (pose === 'bow') {
    arm(-6, -27, 0, -23);
    arm(6, -27, 1, -23);
  } else if (pose === 'pole') {
    arm(-6, -27, -6, -31, true);
    arm(6, -27, 7, -31, true);
  } else {
    arm(-6.5, -27, -8, -16);
    arm(6.5, -27, 8, -16);
  }

  // 头
  const hy = -36 * u + lift;
  ctx.fillStyle = SKIN;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.5 * u;
  ctx.beginPath();
  ctx.arc(0.6 * u, hy, 5.2 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 眉眼（背对镜头时整个头是头发）
  if (opt.back) {
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(0.6 * u, hy, 5.3 * u, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#2a1d14';
    ctx.fillRect(1.2 * u, hy + 0.2 * u, 1.1 * u, 0.9 * u);
    ctx.fillRect(4.1 * u, hy + 0.2 * u, 1.0 * u, 0.9 * u);
    ctx.fillStyle = 'rgba(210,110,90,0.35)';
    ctx.beginPath();
    ctx.arc(3.6 * u, hy + 2.6 * u, 1.3 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHead(ctx, u, hy, opt.hat || 'bun', opt);
  if (opt.beard) {
    ctx.fillStyle = opt.beard;
    ctx.beginPath();
    ctx.moveTo(1 * u, hy + 3 * u);
    ctx.quadraticCurveTo(3 * u, hy + 9 * u, 5 * u, hy + 3 * u);
    ctx.fill();
  }
  ctx.restore();
}

function drawHead(ctx, u, hy, hat, opt) {
  const hair = () => {
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.arc(0.6 * u, hy - 0.3 * u, 5.5 * u, Math.PI * 0.95, Math.PI * 2.05);
    ctx.quadraticCurveTo(5 * u, hy - 2 * u, 0.6 * u, hy - 2.4 * u);
    ctx.quadraticCurveTo(-3 * u, hy - 1.5 * u, -4.9 * u, hy + 1.8 * u);
    ctx.fill();
  };
  switch (hat) {
    case 'futou': // 幞头：黑色软帽，脚垂在脑后
      hair();
      ctx.fillStyle = '#1b1714';
      ctx.beginPath();
      ctx.ellipse(0.4 * u, hy - 5.2 * u, 5.4 * u, 4.4 * u, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5 * u, hy - 5.4 * u, 10.8 * u, 2.4 * u);
      ctx.beginPath();
      ctx.ellipse(-0.8 * u, hy - 8.6 * u, 3.4 * u, 3 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1b1714';
      ctx.lineWidth = 1.2 * u;
      ctx.beginPath();
      ctx.moveTo(-4.5 * u, hy - 4 * u);
      ctx.quadraticCurveTo(-8 * u, hy, -7 * u, hy + 5 * u);
      ctx.stroke();
      break;
    case 'official': // 官帽：两翅平伸
      hair();
      ctx.fillStyle = '#141210';
      ctx.fillRect(-4.6 * u, hy - 10.5 * u, 10.4 * u, 7 * u);
      ctx.fillRect(-5.2 * u, hy - 5 * u, 11.6 * u, 2.4 * u);
      ctx.fillRect(-15 * u, hy - 8.4 * u, 31 * u, 1.3 * u);
      ctx.fillStyle = '#c9a24a';
      ctx.fillRect(-4.6 * u, hy - 4.6 * u, 10.4 * u, 0.7 * u);
      break;
    case 'straw': // 斗笠
      ctx.fillStyle = '#c7a568';
      ctx.strokeStyle = 'rgba(90,60,25,0.7)';
      ctx.lineWidth = 0.5 * u;
      ctx.beginPath();
      ctx.moveTo(-11 * u, hy - 1.5 * u);
      ctx.quadraticCurveTo(0.5 * u, hy - 4 * u, 12 * u, hy - 1.5 * u);
      ctx.lineTo(0.5 * u, hy - 10 * u);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0.5 * u, hy - 10 * u);
        ctx.lineTo((0.5 + i * 3.4) * u, hy - 2.4 * u);
        ctx.stroke();
      }
      break;
    case 'wrap': // 小二：白布包头
      hair();
      ctx.fillStyle = '#f1ece0';
      ctx.beginPath();
      ctx.ellipse(0.6 * u, hy - 3.2 * u, 5.8 * u, 3.6 * u, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5.2 * u, hy - 3.6 * u, 11.6 * u, 1.8 * u);
      ctx.beginPath();
      ctx.arc(-5 * u, hy - 3 * u, 1.4 * u, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'chef': // 厨子：白色高帽巾
      hair();
      ctx.fillStyle = '#f4f0e6';
      ctx.beginPath();
      ctx.ellipse(0.6 * u, hy - 7 * u, 6 * u, 5 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-5 * u, hy - 5 * u, 11.2 * u, 2.6 * u);
      break;
    case 'lady': // 双髻 + 簪花
      hair();
      ctx.fillStyle = HAIR;
      ctx.beginPath();
      ctx.arc(-3.4 * u, hy - 6 * u, 2.8 * u, 0, Math.PI * 2);
      ctx.arc(4.6 * u, hy - 6 * u, 2.8 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-5 * u, hy);
      ctx.quadraticCurveTo(-6.5 * u, hy + 6 * u, -4 * u, hy + 9 * u);
      ctx.lineTo(-3 * u, hy + 2 * u);
      ctx.fill();
      ctx.fillStyle = opt.flower || '#d4513f';
      ctx.beginPath();
      ctx.arc(5.6 * u, hy - 3.6 * u, 1.4 * u, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'hu': // 胡帽：外国使者的尖毡帽
      ctx.fillStyle = '#5e4630';
      ctx.beginPath();
      ctx.moveTo(-5.6 * u, hy - 2 * u);
      ctx.quadraticCurveTo(-2 * u, hy - 15 * u, 3 * u, hy - 15 * u);
      ctx.quadraticCurveTo(6 * u, hy - 8 * u, 6.6 * u, hy - 2 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2f6b6a';
      ctx.fillRect(-6 * u, hy - 3.2 * u, 13.2 * u, 2.4 * u);
      ctx.fillStyle = '#d9b44a';
      ctx.beginPath();
      ctx.arc(0.6 * u, hy - 2 * u, 1.1 * u, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'rough': // 地痞：乱发 + 发带
      ctx.fillStyle = HAIR;
      ctx.beginPath();
      ctx.arc(0.6 * u, hy - 0.5 * u, 5.8 * u, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo((-4 + i * 2.4) * u, hy - 4 * u);
        ctx.lineTo((-5 + i * 2.6) * u, hy - 8.5 * u);
        ctx.lineTo((-2.5 + i * 2.4) * u, hy - 5 * u);
        ctx.fill();
      }
      ctx.fillStyle = '#b23a2a';
      ctx.fillRect(-5 * u, hy - 3.4 * u, 11.2 * u, 1.4 * u);
      break;
    default: // 发髻 + 簪子
      hair();
      ctx.fillStyle = HAIR;
      ctx.beginPath();
      ctx.arc(0.2 * u, hy - 6.6 * u, 2.6 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a24a';
      ctx.lineWidth = 0.6 * u;
      ctx.beginPath();
      ctx.moveTo(-3.4 * u, hy - 7.2 * u);
      ctx.lineTo(3.8 * u, hy - 6 * u);
      ctx.stroke();
  }
}

// 对话气泡。尖角指向 (x, y)。
export function bubble(ctx, x, y, text, opt = {}) {
  const size = opt.size || 12;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = `${size}px ${opt.font || '"Noto Serif SC", "WenQuanYi Zen Hei", serif'}`;
  const w = ctx.measureText(text).width + size * 1.1;
  const h = size * 1.75;
  const bx = Math.round(x - w / 2 + (opt.dx || 0));
  const by = Math.round(y - h - 7);
  ctx.fillStyle = opt.bg || 'rgba(251,244,226,0.95)';
  ctx.strokeStyle = opt.border || 'rgba(94,64,36,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, h / 2.4);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, by + h - 0.5);
  ctx.lineTo(x, y - 1);
  ctx.lineTo(x + 4, by + h - 0.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 4, by + h);
  ctx.lineTo(x, y - 1);
  ctx.lineTo(x + 4, by + h);
  ctx.stroke();
  ctx.fillStyle = opt.color || '#3a2616';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + size * 0.55, by + h / 2 + 0.5);
  ctx.restore();
}

// 页面告诉截图脚本"画完了"
export async function ready() {
  await document.fonts.ready;
  window.__ready = true;
}
