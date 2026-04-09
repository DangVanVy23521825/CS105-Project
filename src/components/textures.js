import * as THREE from "three";

function makeCanvasTexture(drawFn, repeat = 2) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  drawFn(ctx, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  return texture;
}

function createGridTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    const step = 32;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }, 2);
}

function createWoodTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const y = (i / 140) * h;
      const noise = Math.sin(i * 0.3) * 8;
      ctx.strokeStyle = `rgba(60,30,10,${0.12 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y + noise);
      ctx.bezierCurveTo(w * 0.25, y + 4, w * 0.75, y - 4, w, y + noise);
      ctx.stroke();
    }
  }, 1.5);
}

function createMetalTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#808a98");
    grad.addColorStop(0.5, "#aeb8c5");
    grad.addColorStop(1, "#5a6472");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.14})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + (Math.random() - 0.5) * 3); ctx.stroke();
    }
  }, 2);
}

function createBrickTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#8b4513";
    ctx.fillRect(0, 0, w, h);
    const bw = 64, bh = 32, gap = 3;
    for (let row = 0; row < h / bh; row++) {
      const offset = (row % 2) * (bw / 2);
      for (let col = -1; col < w / bw + 1; col++) {
        const x = col * bw + offset;
        const y = row * bh;
        const r = 130 + Math.random() * 40;
        const g = 55 + Math.random() * 25;
        const b = 20 + Math.random() * 15;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + gap, y + gap, bw - gap * 2, bh - gap * 2);
      }
    }
    ctx.strokeStyle = "#5c3317";
    ctx.lineWidth = gap;
    for (let row = 0; row <= h / bh; row++) ctx.strokeRect(0, row * bh, w, 0);
  }, 1);
}

function createMarbleTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#e8e0d6");
    grad.addColorStop(0.4, "#d4cfc9");
    grad.addColorStop(0.7, "#c8bfb4");
    grad.addColorStop(1, "#f0ece5");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++) {
      ctx.strokeStyle = `rgba(100,90,80,${0.06 + Math.random() * 0.1})`;
      ctx.lineWidth = 0.5 + Math.random() * 2;
      ctx.beginPath();
      const sx = Math.random() * w, sy = Math.random() * h;
      ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(sx + Math.random() * 200 - 100, sy + Math.random() * 60, sx + Math.random() * 200 - 100, sy + Math.random() * 60, sx + Math.random() * 150 - 75, sy + Math.random() * 120);
      ctx.stroke();
    }
  }, 1.2);
}

function createCheckerTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const size = 64;
    for (let r = 0; r < h / size; r++) {
      for (let c = 0; c < w / size; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#e2e8f0" : "#1e293b";
        ctx.fillRect(c * size, r * size, size, size);
      }
    }
  }, 1);
}

function createLavaTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "#ff4500");
    grad.addColorStop(0.4, "#cc3300");
    grad.addColorStop(0.8, "#8b0000");
    grad.addColorStop(1, "#1a0000");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * w, cy = Math.random() * h;
      const r = 10 + Math.random() * 40;
      const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g2.addColorStop(0, `rgba(255,200,0,${0.3 + Math.random() * 0.3})`);
      g2.addColorStop(1, "rgba(255,69,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }, 1);
}

function createGrassTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#2d5a27";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 8 + Math.random() * 18;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const green = 100 + Math.floor(Math.random() * 80);
      ctx.strokeStyle = `rgba(${30 + Math.random() * 30},${green},${20 + Math.random() * 20},0.6)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
  }, 2);
}

export function createTextureLibrary() {
  return {
    grid: createGridTexture(),
    wood: createWoodTexture(),
    metal: createMetalTexture(),
    brick: createBrickTexture(),
    marble: createMarbleTexture(),
    checker: createCheckerTexture(),
    lava: createLavaTexture(),
    grass: createGrassTexture()
  };
}

export function loadTextureFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const texture = new THREE.Texture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        resolve(texture);
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
