// 宋人画法（第二版）：按参考图拆解的比例来画。
// - 约 7 头身，身材修长，五官极简
// - 衣服：短褐（交领短衣+裤+绑腿）、长袍、女子短衫+长裙/褙子
// - 平涂加柔和明暗：左亮右暗，细的暖深棕描边
import { shade, rgba } from './common.js';

const LINE = 'rgba(58,38,20,0.6)';
const SKIN = '#dcae86';
const HAIR = '#221b16';

function fillShape(ctx, path, base, u, light = true) {
  ctx.beginPath();
  path();
  if (light) {
    const g = ctx.createLinearGradient(-12 * u, 0, 12 * u, 0);
    g.addColorStop(0, shade(base, 0.1));
    g.addColorStop(0.55, base);
    g.addColorStop(1, shade(base, -0.22));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = base;
  }
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.75;
  ctx.stroke();
}

function limb(ctx, pts, w, color) {
  ctx.strokeStyle = shade(color, -0.35);
  ctx.lineWidth = w + 1.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

function dot(ctx, x, y, r, c) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// 地上的影子：光从右上来，影子拖向左下
export function personShadow(ctx, x, y, s, sit = false) {
  const u = s / 100;
  ctx.save();
  ctx.fillStyle = 'rgba(80,52,26,0.26)';
  ctx.filter = 'blur(1.5px)';
  ctx.beginPath();
  ctx.ellipse(x - 18 * u, y + 4 * u, (sit ? 22 : 28) * u, 5 * u, -0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(70,45,22,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y, 9 * u, 3 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 脚底在 (x, y)，s = 站立身高（像素）。
// o: top 上衣色, bottom 裤/裙色, sash 腰带, garb: short|long|dress|beizi,
//    hat: jin|futou|straw|scholar|lady|none, pose: stand|walk|sit|squat|pour|tray|drink|pole|tend|tie,
//    facing 1 朝右 / -1 朝左, back 背对, apron 围裙色, box 背书箱, leggings 绑腿
export function drawSong(ctx, x, y, s, o = {}) {
  const u = s / 100;
  const pose = o.pose || 'stand';
  const sit = pose === 'sit' || !!o.seated, squat = pose === 'squat';
  const top = o.top || '#6f6a55';
  const bottom = o.bottom || shade(top, -0.3);
  const garb = o.garb || 'short';
  // 上半身整体下移（坐、蹲）
  const drop = sit ? 26 * u : squat ? 36 * u : 0;
  if (!o.noShadow) personShadow(ctx, x, y, s, sit || squat);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.facing || 1, 1);

  // 书箱（背在身后，先画）
  if (o.box && !o.back) {
    fillShape(ctx, () => ctx.rect(-12 * u, -94 * u + drop, 15 * u, 30 * u), '#7a5a36', u);
    ctx.strokeStyle = 'rgba(50,30,15,0.6)';
    ctx.lineWidth = 0.6;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-12 * u, -94 * u + drop + i * 7.5 * u);
      ctx.lineTo(3 * u, -94 * u + drop + i * 7.5 * u);
      ctx.stroke();
    }
    fillShape(ctx, () => {
      ctx.moveTo(-15 * u, -95 * u + drop);
      ctx.quadraticCurveTo(-4 * u, -103 * u + drop, 6 * u, -95 * u + drop);
      ctx.lineTo(-15 * u, -95 * u + drop);
    }, '#c8b48a', u, false);
  }

  // 挑担：扁担靠在身边、两个筐放地上（休息时）或挑在肩上
  if (pose === 'pole') {
    ctx.strokeStyle = '#6e4e2c';
    ctx.lineWidth = 2.2 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-34 * u, -80 * u);
    ctx.quadraticCurveTo(0, -84 * u, 34 * u, -80 * u);
    ctx.stroke();
    for (const bx of [-32, 32]) basket(ctx, bx * u, -14 * u, u, bx < 0 ? '#6f8a3c' : '#c9883a', -80 * u);
  }

  // ---- 下半身 ----
  if (sit) {
    // 膝盖朝前（朝镜头），小腿垂下
    const pant = garb === 'long' || garb === 'dress' || garb === 'beizi' ? top : bottom;
    const skirt = garb === 'dress' || garb === 'beizi' ? bottom : pant;
    limb(ctx, [[-4 * u, -24 * u], [-4.5 * u, -2 * u]], 6 * u, skirt);
    limb(ctx, [[5 * u, -24 * u], [5.5 * u, -2 * u]], 6 * u, skirt);
    fillShape(ctx, () => {
      ctx.moveTo(-10 * u, -32 * u);
      ctx.lineTo(10 * u, -32 * u);
      ctx.quadraticCurveTo(13 * u, -24 * u, 9 * u, -20 * u);
      ctx.lineTo(-9 * u, -20 * u);
      ctx.quadraticCurveTo(-12 * u, -24 * u, -10 * u, -32 * u);
    }, skirt, u);
    if (garb === 'long') {
      fillShape(ctx, () => {
        ctx.moveTo(-10 * u, -24 * u);
        ctx.lineTo(10 * u, -24 * u);
        ctx.lineTo(11 * u, -6 * u);
        ctx.lineTo(-11 * u, -6 * u);
      }, top, u);
    }
    feet(ctx, u, -4.5, 5.5);
  } else if (squat) {
    limb(ctx, [[-6 * u, -34 * u], [-9 * u, -22 * u], [-6 * u, -2 * u]], 6.5 * u, bottom);
    limb(ctx, [[6 * u, -34 * u], [10 * u, -22 * u], [7 * u, -2 * u]], 6.5 * u, bottom);
    feet(ctx, u, -6, 7);
  } else {
    const walk = pose === 'walk' || pose === 'pole';
    const lf = walk ? -7 : -4, rf = walk ? 7 : 4;
    if (garb === 'short' || garb === 'beizi') {
      const leg = garb === 'beizi' ? bottom : bottom;
      if (garb === 'short') {
        limb(ctx, [[-4 * u, -40 * u], [lf * u, -3 * u]], 6.5 * u, leg);
        limb(ctx, [[4 * u, -40 * u], [rf * u, -3 * u]], 6.5 * u, leg);
        if (o.leggings) {
          limb(ctx, [[(lf + (-4 - lf) * 0.35) * u, -16 * u], [lf * u, -4 * u]], 6 * u, o.leggings);
          limb(ctx, [[(rf + (4 - rf) * 0.35) * u, -16 * u], [rf * u, -4 * u]], 6 * u, o.leggings);
        }
      }
    }
    if (garb === 'dress' || garb === 'beizi') {
      // 长裙
      fillShape(ctx, () => {
        ctx.moveTo(-7.5 * u, -64 * u);
        ctx.lineTo(7.5 * u, -64 * u);
        ctx.quadraticCurveTo(11 * u, -30 * u, 12.5 * u, -1.5 * u);
        ctx.quadraticCurveTo(0, 1 * u, -12.5 * u, -1.5 * u);
        ctx.quadraticCurveTo(-11 * u, -30 * u, -7.5 * u, -64 * u);
      }, bottom, u);
      if (o.dots) {
        for (let i = 0; i < 14; i++) dot(ctx, (-8 + ((i * 37) % 17)) * u, (-58 + ((i * 23) % 54)) * u, 0.7 * u, o.dots);
      }
    }
    feet(ctx, u, lf, rf);
  }

  ctx.translate(0, drop);

  // ---- 上身 ----
  if (garb === 'long') {
    fillShape(ctx, () => {
      ctx.moveTo(-10.5 * u, -80 * u);
      ctx.lineTo(10.5 * u, -80 * u);
      ctx.quadraticCurveTo(9 * u, -60 * u, sit ? 10 * u : 12 * u, sit ? -30 * u : -4 * u);
      ctx.quadraticCurveTo(0, sit ? -28 * u : -2 * u, sit ? -10 * u : -12 * u, sit ? -30 * u : -4 * u);
      ctx.quadraticCurveTo(-9 * u, -60 * u, -10.5 * u, -80 * u);
    }, top, u);
    // 衣褶
    fold(ctx, u, [[3, -52], [4.5, sit ? -32 : -8]]);
    fold(ctx, u, [[-3, -50], [-5, sit ? -32 : -10]]);
  } else if (garb === 'short') {
    fillShape(ctx, () => {
      ctx.moveTo(-10.5 * u, -80 * u);
      ctx.lineTo(10.5 * u, -80 * u);
      ctx.quadraticCurveTo(9 * u, -60 * u, 11 * u, -34 * u);
      ctx.quadraticCurveTo(0, -32 * u, -11 * u, -34 * u);
      ctx.quadraticCurveTo(-9 * u, -60 * u, -10.5 * u, -80 * u);
    }, top, u);
    fold(ctx, u, [[4, -52], [5, -36]]);
    if (o.apron) {
      fillShape(ctx, () => {
        ctx.moveTo(-8 * u, -58 * u);
        ctx.lineTo(8 * u, -58 * u);
        ctx.lineTo(9 * u, -30 * u);
        ctx.lineTo(-9 * u, -30 * u);
      }, o.apron, u);
    }
  } else {
    // 女子短衫（褙子则更长，开襟露出裙子）
    const len = garb === 'beizi' ? -26 : -56;
    fillShape(ctx, () => {
      ctx.moveTo(-9.5 * u, -80 * u);
      ctx.lineTo(9.5 * u, -80 * u);
      ctx.quadraticCurveTo(9 * u, -66 * u, 11 * u, len * u);
      ctx.lineTo(-11 * u, len * u);
      ctx.quadraticCurveTo(-9 * u, -66 * u, -9.5 * u, -80 * u);
    }, top, u);
    if (garb === 'beizi') {
      ctx.fillStyle = bottom;
      ctx.beginPath();
      ctx.moveTo(-1.5 * u, -78 * u);
      ctx.lineTo(2 * u, -78 * u);
      ctx.lineTo(4 * u, len * u);
      ctx.lineTo(-3 * u, len * u);
      ctx.fill();
    }
  }
  // 腰带
  if (garb === 'short' || garb === 'long') {
    ctx.fillStyle = o.sash || '#2a2219';
    ctx.fillRect(-9.5 * u, -59 * u, 19 * u, 3.4 * u);
    ctx.fillRect(1 * u, -56 * u, 2 * u, 12 * u);
    ctx.fillRect(3.4 * u, -56 * u, 1.8 * u, 10 * u);
  }
  // 交领
  if (!o.back) {
    ctx.strokeStyle = shade(top, 0.45);
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.moveTo(-3.5 * u, -81 * u);
    ctx.lineTo(3 * u, garb === 'dress' || garb === 'beizi' ? -70 * u : -62 * u);
    ctx.moveTo(3.5 * u, -81 * u);
    ctx.lineTo(0.5 * u, -74 * u);
    ctx.stroke();
  }

  // ---- 手臂 ----
  const sleeve = garb === 'dress' || garb === 'beizi' ? top : top;
  const hand = (hx, hy) => dot(ctx, hx * u, hy * u, 2 * u, SKIN);
  const arms = {
    stand: [[[-10, -78], [-12.5, -60], [-11.5, -45]], [[10, -78], [12.5, -60], [11.5, -45]]],
    walk: [[[-10, -78], [-13, -61], [-9, -47]], [[10, -78], [13, -61], [15, -48]]],
    sit: [[[-10, -78], [-11, -63], [-4, -56]], [[10, -78], [11, -63], [5, -56]]],
    squat: [[[-10, -78], [-12, -64], [-8, -54]], [[10, -78], [12, -64], [8, -54]]],
    drink: [[[-10, -78], [-11, -63], [-4, -58]], [[10, -78], [13, -70], [5, -86]]],
    pour: [[[-10, -78], [-12, -62], [-10, -48]], [[10, -78], [15, -68], [22, -66]]],
    tray: [[[-10, -78], [-11, -63], [2, -62]], [[10, -78], [12, -64], [14, -62]]],
    pole: [[[-10, -78], [-12, -82], [-6, -84]], [[10, -78], [12, -66], [11, -50]]],
    tend: [[[-10, -78], [-8, -62], [2, -55]], [[10, -78], [14, -66], [20, -58]]],
    tie: [[[-10, -78], [-6, -64], [4, -58]], [[10, -78], [14, -62], [12, -54]]],
  }[pose];
  for (const arm of arms) {
    limb(ctx, arm.map(([ax, ay]) => [ax * u, ay * u]), 5.5 * u, shade(sleeve, -0.06));
    hand(arm[2][0], arm[2][1]);
  }
  if (pose === 'drink') bowl(ctx, 5 * u, -88 * u, u);
  if (pose === 'pour') kettle(ctx, 24 * u, -66 * u, u, -0.6);
  if (pose === 'tray') {
    ctx.fillStyle = '#6b4a2a';
    ctx.beginPath();
    ctx.ellipse(8 * u, -63 * u, 12 * u, 3.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    bowl(ctx, 3 * u, -66 * u, u);
    bun(ctx, 12 * u, -65 * u, u);
  }
  if (pose === 'tend') {
    // 拿着蒲扇扇火
    ctx.fillStyle = '#c9a66a';
    ctx.beginPath();
    ctx.ellipse(23 * u, -55 * u, 5 * u, 6.5 * u, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();
  }

  // ---- 头 ----
  dot(ctx, 0.5 * u, -83 * u, 2.6 * u, shade(SKIN, -0.08)); // 脖子
  const hy = -91 * u;
  ctx.fillStyle = SKIN;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(1 * u, hy, 6 * u, 7 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (o.back) {
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(1 * u, hy - 0.5 * u, 6.2 * u, 7 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(40,25,15,0.85)';
    ctx.fillRect(1.6 * u, hy - 0.4 * u, 1.8 * u, 0.8 * u);
    ctx.fillRect(4.6 * u, hy - 0.4 * u, 1.5 * u, 0.8 * u);
    ctx.fillStyle = 'rgba(190,110,90,0.25)';
    dot(ctx, 4.6 * u, hy + 3 * u, 1.4 * u, 'rgba(190,110,90,0.22)');
    // 发际
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(1 * u, hy - 3 * u, 6.3 * u, 4.5 * u, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5.2 * u, hy - 2 * u);
    ctx.quadraticCurveTo(-6 * u, hy + 2 * u, -4.4 * u, hy + 3.5 * u);
    ctx.lineTo(-3.6 * u, hy - 2 * u);
    ctx.fill();
  }
  if (o.beard) {
    ctx.fillStyle = o.beard;
    ctx.beginPath();
    ctx.moveTo(1.5 * u, hy + 4 * u);
    ctx.quadraticCurveTo(4 * u, hy + 11 * u, 6 * u, hy + 4 * u);
    ctx.fill();
  }
  hat(ctx, u, hy, o.hat || 'jin', o);
  ctx.restore();
}

function feet(ctx, u, lf, rf) {
  ctx.fillStyle = '#2a2018';
  ctx.beginPath();
  ctx.ellipse(lf * u, -1.6 * u, 3.4 * u, 1.6 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(rf * u, -1.6 * u, 3.4 * u, 1.6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
}
function fold(ctx, u, pts) {
  ctx.strokeStyle = 'rgba(40,25,12,0.22)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * u, y * u) : ctx.moveTo(x * u, y * u)));
  ctx.stroke();
}

function hat(ctx, u, hy, kind, o) {
  const knot = () => {
    ctx.fillStyle = HAIR;
    ctx.beginPath();
    ctx.ellipse(1 * u, hy - 9 * u, 3 * u, 2.6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  switch (kind) {
    case 'jin': // 布巾包发髻
      knot();
      ctx.fillStyle = o.hatColor || '#3a3328';
      ctx.beginPath();
      ctx.ellipse(1 * u, hy - 8.5 * u, 3.8 * u, 3.2 * u, 0, Math.PI * 1.05, Math.PI * 2.0);
      ctx.fill();
      ctx.fillRect(-2.8 * u, hy - 8.5 * u, 7.6 * u, 1.6 * u);
      break;
    case 'futou': // 小幞头
      ctx.fillStyle = '#1c1814';
      ctx.beginPath();
      ctx.ellipse(1 * u, hy - 4 * u, 6.6 * u, 4.6 * u, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0.5 * u, hy - 8.5 * u, 4 * u, 3.6 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1c1814';
      ctx.lineWidth = 1.2 * u;
      ctx.beginPath();
      ctx.moveTo(-4.5 * u, hy - 5 * u);
      ctx.quadraticCurveTo(-8 * u, hy + 2 * u, -7 * u, hy + 8 * u);
      ctx.stroke();
      break;
    case 'scholar': // 东坡巾一类的高方巾
      ctx.fillStyle = '#1f1b17';
      ctx.beginPath();
      ctx.moveTo(-5.5 * u, hy - 3 * u);
      ctx.lineTo(-5 * u, hy - 15 * u);
      ctx.lineTo(7 * u, hy - 15 * u);
      ctx.lineTo(7.5 * u, hy - 3 * u);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(1 * u, hy - 15 * u);
      ctx.lineTo(1 * u, hy - 3 * u);
      ctx.stroke();
      break;
    case 'straw': {
      // 斗笠：宽而平，中间一个小尖
      knot();
      const g = ctx.createLinearGradient(-15 * u, 0, 15 * u, 0);
      g.addColorStop(0, '#cdb07a');
      g.addColorStop(1, '#8e7448');
      ctx.fillStyle = g;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(1 * u, hy - 5 * u, 15 * u, 5 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b39360';
      ctx.beginPath();
      ctx.moveTo(-5 * u, hy - 6 * u);
      ctx.quadraticCurveTo(1 * u, hy - 15 * u, 7 * u, hy - 6 * u);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(80,55,25,0.35)';
      ctx.lineWidth = 0.5;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
        ctx.beginPath();
        ctx.moveTo(1 * u, hy - 7 * u);
        ctx.lineTo(1 * u + Math.cos(a) * 14 * u, hy - 5 * u + Math.sin(a) * 4.6 * u);
        ctx.stroke();
      }
      break;
    }
    case 'lady': // 高髻 + 簪
      ctx.fillStyle = HAIR;
      ctx.beginPath();
      ctx.ellipse(0.5 * u, hy - 10 * u, 4.6 * u, 4.4 * u, 0, 0, Math.PI * 2);
      ctx.ellipse(3.5 * u, hy - 13 * u, 3 * u, 3.4 * u, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a24a';
      ctx.lineWidth = 0.8 * u;
      ctx.beginPath();
      ctx.moveTo(-4 * u, hy - 12 * u);
      ctx.lineTo(6 * u, hy - 9 * u);
      ctx.stroke();
      if (o.flower) dot(ctx, -3.5 * u, hy - 11 * u, 1.5 * u, o.flower);
      break;
    case 'none':
      knot();
      break;
  }
}

export function bowl(ctx, x, y, u) {
  ctx.fillStyle = '#e9e2d0';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(x, y, 3.6 * u, 1.3 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 3.6 * u, y);
  ctx.quadraticCurveTo(x, y + 4.5 * u, x + 3.6 * u, y);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a7a3a';
  ctx.beginPath();
  ctx.ellipse(x, y, 2.6 * u, 0.8 * u, 0, 0, Math.PI * 2);
  ctx.fill();
}
export function bun(ctx, x, y, u) {
  ctx.fillStyle = '#efe6d2';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(x, y, 3.4 * u, 2.4 * u, 0, Math.PI, 0);
  ctx.lineTo(x + 3.4 * u, y + 0.6 * u);
  ctx.lineTo(x - 3.4 * u, y + 0.6 * u);
  ctx.fill();
  ctx.stroke();
}
export function kettle(ctx, x, y, u, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const g = ctx.createLinearGradient(-6 * u, 0, 6 * u, 0);
  g.addColorStop(0, '#6a6458');
  g.addColorStop(1, '#2f2b26');
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6 * u, 5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#3a342c';
  ctx.lineWidth = 1.6 * u;
  ctx.beginPath();
  ctx.moveTo(5 * u, -1 * u);
  ctx.lineTo(10 * u, -4 * u);
  ctx.stroke();
  ctx.lineWidth = 0.9 * u;
  ctx.beginPath();
  ctx.arc(0, -4 * u, 4.5 * u, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.restore();
}
function basket(ctx, x, y, u, goods, ropeTop) {
  if (ropeTop !== undefined) {
    ctx.strokeStyle = 'rgba(70,50,25,0.8)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, ropeTop);
    ctx.lineTo(x - 6 * u, y - 4 * u);
    ctx.moveTo(x, ropeTop);
    ctx.lineTo(x + 6 * u, y - 4 * u);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(x - 8 * u, 0, x + 8 * u, 0);
  g.addColorStop(0, '#c4a26a');
  g.addColorStop(1, '#8a6a3e');
  ctx.fillStyle = g;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x - 8 * u, y - 4 * u);
  ctx.lineTo(x + 8 * u, y - 4 * u);
  ctx.lineTo(x + 6.5 * u, y + 8 * u);
  ctx.lineTo(x - 6.5 * u, y + 8 * u);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90,60,30,0.35)';
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 8 * u + i * 0.4 * u, y - 4 * u + i * 3 * u);
    ctx.lineTo(x + 8 * u - i * 0.4 * u, y - 4 * u + i * 3 * u);
    ctx.stroke();
  }
  ctx.fillStyle = goods;
  ctx.beginPath();
  ctx.ellipse(x, y - 4.5 * u, 7 * u, 2.6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
}
export { basket };
