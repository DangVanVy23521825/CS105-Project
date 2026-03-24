import * as THREE from "three";

function makeCanvasTexture(drawFn, repeat = 2) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
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
    ctx.lineWidth = 2;
    const step = 32;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }, 2);
}

function createWoodTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 100; i += 1) {
      const y = (i / 100) * h;
      const noise = Math.sin(i * 0.3) * 8;
      ctx.strokeStyle = `rgba(60,30,10,${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y + noise);
      ctx.bezierCurveTo(w * 0.3, y + 3, w * 0.7, y - 3, w, y + noise);
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

    for (let i = 0; i < 260; i += 1) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.16})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }
  }, 2);
}

export function createTextureLibrary() {
  return {
    grid: createGridTexture(),
    wood: createWoodTexture(),
    metal: createMetalTexture()
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
