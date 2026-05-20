import * as THREE from "three";

const FORCE_COLORS = {
  F1: "#f97316",
  F2: "#fb923c",
  F3: "#a78bfa"
};

/**
 * Nhan sprite 3D (F1, F2, F3...) — luon huong camera, de doc trong scene.
 */
export function createForceLabel(text, hexColor = "#ffffff") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 56;
  const pad = 10;
  ctx.font = `bold ${fontSize}px system-ui, Segoe UI, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = fontSize + pad * 2;
  canvas.width = w;
  canvas.height = h;

  ctx.font = `bold ${fontSize}px system-ui, Segoe UI, sans-serif`;
  ctx.fillStyle = "rgba(8, 12, 24, 0.82)";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(0, 0, w, h, 8);
  else ctx.rect(0, 0, w, h);
  ctx.fill();
  ctx.strokeStyle = hexColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = hexColor;
  ctx.textBaseline = "middle";
  ctx.fillText(text, pad, h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  const scale = 0.55;
  sprite.scale.set((w / 128) * scale, (h / 128) * scale, 1);
  sprite.renderOrder = 10;
  sprite.raycast = () => {};
  sprite.userData._dispose = () => {
    texture.dispose();
    material.dispose();
  };
  return sprite;
}

export function createForceLabelSet(names = ["F1", "F2", "F3"]) {
  const labels = {};
  for (const name of names) {
    labels[name] = createForceLabel(name, FORCE_COLORS[name] ?? "#ffffff");
  }
  return labels;
}

/** Dat nhan o dau mui ten luc (world space) */
export function placeLabelAtVectorTip(label, origin, vec, arrowDisplayLen) {
  const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
  if (len < 0.01) {
    label.visible = false;
    return;
  }
  label.visible = true;
  const t = arrowDisplayLen / len;
  label.position.set(
    origin.x + vec.x * t,
    origin.y + vec.y * t,
    origin.z + vec.z * t
  );
}

export function disposeLabels(labels) {
  for (const l of Object.values(labels)) {
    l.userData._dispose?.();
    l.parent?.remove(l);
  }
}
