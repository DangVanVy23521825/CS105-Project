import * as THREE from "three";
import { state, setSelectedObject } from "./state.js";
import { createPhysicsEngine } from "./engine/physics.js";
import { createView } from "./engine/view.js";
import { createSceneManager } from "./engine/sceneManager.js";
import { createTextureLibrary, loadTextureFromFile } from "./components/textures.js";
import { createForceVisualizers, createCollisionParticles } from "./components/visualizers.js";
import { updateObjectScale } from "./components/geometries.js";
import { createInputSystem } from "./interaction/input.js";
import { createUI } from "./interaction/ui.js";
import { loadModelFromFile } from "./components/modelLoader.js";
import { applyEnvironment } from "./components/environment.js";

// ─── DOM refs ───
const container = document.getElementById("viewport");
const imageInput = document.getElementById("imageInput");
const modelInput = document.getElementById("modelInput");

// ─── HUD elements ───
const hudName    = document.getElementById("hudName");
const hudPos     = document.getElementById("hudPos");
const hudVel     = document.getElementById("hudVel");
const hudMass    = document.getElementById("hudMass");
const hudEnergy  = document.getElementById("hudEnergy");
const hudFormula = document.getElementById("hudFormula");

// ─── Core engine ───
const view = createView(container);
const physics = createPhysicsEngine();
const textureLibrary = createTextureLibrary();
const forceVisualizers = createForceVisualizers(view.scene);
const collisionParticles = createCollisionParticles(view.scene);

const modelState = {
  activeSceneMeta: null,
  customTexture: null
};

const sceneManager = createSceneManager({
  scene: view.scene,
  world: physics.world,
  getTexture(name) {
    if (name === "custom" && modelState.customTexture) return modelState.customTexture;
    return textureLibrary[name] ?? textureLibrary.grid;
  },
  physicsMaterial: physics.defaultMaterial
});

// ─── Hiệu ứng va chạm ───
physics.onCollision((contact) => {
  const impulse = contact.getImpactVelocityAlongNormal?.();
  if (impulse !== undefined && Math.abs(impulse) > 4) {
    const pt = contact.bi.position;
    collisionParticles.spawn(new THREE.Vector3(pt.x, pt.y, pt.z), 0xffa500);
  }
});

// ─── Sidebar: Scene cards ───
const sceneCards = document.querySelectorAll(".scene-card");
sceneCards.forEach((card) => {
  card.addEventListener("click", () => {
    const name = card.dataset.scene;
    sceneCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    buildScene(name);
    toggleDebugMode(state.debugMode);
  });
});

// ─── Sidebar: Spawn grid ───
document.querySelectorAll(".spawn-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.shape;
    const obj = sceneManager.spawnShape(type);
    syncStateObjects();
    setSelectedObject(obj);
    input.attachTransform(obj);
    ui.syncFromSelected();
    refreshObjectList();
    if (state.debugMode) toggleDebugMode(true);
  });
});

// ─── Sidebar: Environment ───
document.querySelectorAll(".env-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".env-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.environment = btn.dataset.env;
    applyEnvironment(state.environment, view);
  });
});

// ─── Sidebar: Action buttons ───
document.getElementById("btnReset")?.addEventListener("click", resetScene);
document.getElementById("btnScreenshot")?.addEventListener("click", takeScreenshot);
document.getElementById("btnLoadModel")?.addEventListener("click", () => modelInput.click());
document.getElementById("btnLoadTexture")?.addEventListener("click", () => imageInput.click());
document.getElementById("btnToggleAnim")?.addEventListener("click", () => {
  state.autoAnimation = !state.autoAnimation;
  const btn = document.getElementById("btnToggleAnim");
  btn.textContent = state.autoAnimation ? "⏸ Pause Anim" : "▶ Animation";
});
document.getElementById("btnShortcuts")?.addEventListener("click", () => {
  document.getElementById("shortcutsOverlay")?.classList.toggle("show");
});
document.getElementById("shortcutsOverlay")?.addEventListener("click", (e) => {
  if (e.target.id === "shortcutsOverlay") e.target.classList.remove("show");
});

// ─── Transform toolbar ───
document.querySelectorAll(".tf-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tf-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const mode = btn.dataset.mode;
    state.transformMode = mode;
    input.setTransformMode(mode);
  });
});

// ─── Helpers ───
function syncStateObjects() {
  state.objects = sceneManager.objects;
}

function buildScene(name) {
  state.currentScene = name;
  modelState.activeSceneMeta = sceneManager.buildScene(name);
  setSelectedObject(null);
  input.attachTransform(null);
  syncStateObjects();
  updateFormula();
  refreshObjectList();
}

function resetScene() {
  buildScene(state.currentScene);
  toggleDebugMode(state.debugMode);
}

function updateFormula() {
  const mu = physics.defaultContactMaterial.friction.toFixed(2);
  const g = Math.abs(physics.world.gravity.y).toFixed(2);
  const e = physics.defaultContactMaterial.restitution.toFixed(2);
  switch (state.currentScene) {
    case "Inclined Plane": {
      const deg = ui.params.rampAngleDeg.toFixed(0);
      const theta = THREE.MathUtils.degToRad(ui.params.rampAngleDeg);
      const gVal = physics.world.gravity.length();
      const a = gVal * Math.sin(theta) - physics.defaultContactMaterial.friction * gVal * Math.cos(theta);
      hudFormula.textContent = `a = g·sin(θ) − μ·g·cos(θ) | θ=${deg}° | μ=${mu} | a≈${a.toFixed(2)} m/s²`;
      break;
    }
    case "Free Fall":
      hudFormula.textContent = `s = ½·g·t² | g=${g} m/s² — Khối lượng khác nhau, rơi như nhau (Galileo)`;
      break;
    case "Horizontal Force":
      hudFormula.textContent = `F − f = m·a | f = μ·N | μ=${mu}`;
      break;
    case "Collision Playground":
      hudFormula.textContent = `Bảo toàn động lượng: m₁v₁ + m₂v₂ = const | e=${e}`;
      break;
    case "Domino Chain":
      hudFormula.textContent = `Phản ứng dây chuyền — Năng lượng truyền qua tiếp xúc va chạm`;
      break;
    default:
      hudFormula.textContent = "—";
  }
}

function applyTextureToSelected(textureKey) {
  const selected = state.selectedObject;
  if (!selected) return;
  const texture = textureKey === "custom" ? modelState.customTexture : textureLibrary[textureKey];
  if (!texture) return;
  selected.mesh.traverse((child) => {
    if (!child.isMesh) return;
    child.material.map = texture;
    child.material.needsUpdate = true;
  });
}

function toggleDebugMode(enabled) {
  state.debugMode = enabled;
  for (const h of state.helpers.boxHelpers) view.scene.remove(h);
  for (const w of state.helpers.wireframes) view.scene.remove(w);
  state.helpers.boxHelpers = [];
  state.helpers.wireframes = [];
  if (state.helpers.cameraHelper) {
    view.scene.remove(state.helpers.cameraHelper);
    state.helpers.cameraHelper = null;
  }
  if (!enabled) return;
  for (const obj of sceneManager.objects) {
    const bh = new THREE.BoxHelper(obj.mesh, 0x22d3ee);
    state.helpers.boxHelpers.push(bh);
    view.scene.add(bh);
    if (obj.mesh.isMesh) {
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(obj.mesh.geometry),
        new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 })
      );
      wire.userData.target = obj.mesh;
      state.helpers.wireframes.push(wire);
      view.scene.add(wire);
    }
  }
  state.helpers.cameraHelper = new THREE.CameraHelper(view.camera);
  view.scene.add(state.helpers.cameraHelper);
}

function refreshDebugHelpers() {
  if (!state.debugMode) return;
  state.helpers.boxHelpers.forEach((h) => h.update());
  state.helpers.wireframes.forEach((w) => {
    const t = w.userData.target;
    if (!t) return;
    w.position.copy(t.position);
    w.quaternion.copy(t.quaternion);
    w.scale.copy(t.scale);
  });
  state.helpers.cameraHelper?.update();
}

function syncMeshFromBody() {
  for (const item of sceneManager.objects) {
    item.mesh.position.set(item.body.position.x, item.body.position.y, item.body.position.z);
    item.mesh.quaternion.set(item.body.quaternion.x, item.body.quaternion.y, item.body.quaternion.z, item.body.quaternion.w);
  }
}

function takeScreenshot() {
  view.renderer.render(view.scene, view.camera);
  const dataURL = view.renderer.domElement.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `CS105_screenshot_${Date.now()}.png`;
  link.href = dataURL;
  link.click();
}

// ─── Object list sidebar ───
function refreshObjectList() {
  const listEl = document.getElementById("objectList");
  if (!listEl) return;
  listEl.innerHTML = "";
  for (const obj of sceneManager.objects) {
    const el = document.createElement("div");
    el.className = "obj-item" + (obj === state.selectedObject ? " active" : "");

    const nameSpan = document.createElement("span");
    nameSpan.className = "obj-name";
    nameSpan.innerHTML = `<span class="obj-dot" style="background:${obj.body.mass === 0 ? '#64748b' : '#38bdf8'}"></span>${obj.mesh.name || obj.kind}`;

    const delBtn = document.createElement("button");
    delBtn.className = "obj-del";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.selectedObject === obj) {
        setSelectedObject(null);
        input.attachTransform(null);
      }
      sceneManager.removeObject(obj);
      syncStateObjects();
      refreshObjectList();
    });

    el.appendChild(nameSpan);
    if (obj.body.mass > 0) el.appendChild(delBtn);

    el.addEventListener("click", () => {
      setSelectedObject(obj);
      input.attachTransform(obj);
      ui.syncFromSelected();
      refreshObjectList();
    });

    listEl.appendChild(el);
  }
}

// ─── HUD update ───
function updateHUD() {
  const sel = state.selectedObject;
  if (!sel) {
    hudName.textContent = "—";
    hudPos.textContent = "—";
    hudVel.textContent = "—";
    hudMass.textContent = "—";
    hudEnergy.textContent = "—";
    return;
  }
  hudName.textContent = sel.mesh.name || sel.kind;
  const p = sel.body.position;
  hudPos.textContent = `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;

  const v = sel.body.velocity;
  const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  hudVel.textContent = `${speed.toFixed(2)} m/s`;

  hudMass.textContent = `${sel.body.mass.toFixed(1)} kg`;

  const ke = 0.5 * sel.body.mass * speed * speed;
  const pe = sel.body.mass * Math.abs(physics.world.gravity.y) * Math.max(0, p.y);
  hudEnergy.textContent = `KE=${ke.toFixed(1)} PE=${pe.toFixed(1)} J`;
}

// ─── UI panel (lil-gui) ───
const ui = createUI({
  camera: view.camera,
  lights: view.lights,
  onPhysicsChange: ({ friction, restitution }) => {
    physics.setMaterialProps({ friction, restitution });
    updateFormula();
  },
  getSelected: () => state.selectedObject,
  setTextureForSelected: (name) => applyTextureToSelected(name),
  onRampAngleChange: (angleRad) => {
    if (modelState.activeSceneMeta?.rampObject) {
      sceneManager.setRampAngle(modelState.activeSceneMeta.rampObject, angleRad);
      updateFormula();
    }
  }
});

// ─── Input system ───
const input = createInputSystem({
  renderer: view.renderer,
  camera: view.camera,
  scene: view.scene,
  orbitControls: view.controls,
  getObjects: () => sceneManager.objects,
  getSelected: () => state.selectedObject,
  setSelected: (selected) => {
    setSelectedObject(selected);
    ui.syncFromSelected();
    refreshObjectList();
  },
  onScale: (selected, scale) => updateObjectScale(selected, scale),
  onReset: resetScene,
  onToggleAnimation: () => {
    state.autoAnimation = !state.autoAnimation;
    const btn = document.getElementById("btnToggleAnim");
    if (btn) btn.textContent = state.autoAnimation ? "⏸ Pause Anim" : "▶ Animation";
  },
  onToggleDebug: () => toggleDebugMode(!state.debugMode),
  onDeleteSelected: () => {
    if (!state.selectedObject || state.selectedObject.body.mass === 0) return;
    sceneManager.removeObject(state.selectedObject);
    setSelectedObject(null);
    input.attachTransform(null);
    syncStateObjects();
    refreshObjectList();
  },
  onTransformModeChange: (mode) => {
    state.transformMode = mode;
    document.querySelectorAll(".tf-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });
  }
});

// ─── File inputs ───
imageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    modelState.customTexture = await loadTextureFromFile(file);
    applyTextureToSelected("custom");
  } catch (err) {
    console.error("Lỗi load texture:", err);
  } finally { imageInput.value = ""; }
});

modelInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const modelObj = await loadModelFromFile({
      file,
      texture: textureLibrary.metal,
      physicsMaterial: physics.defaultMaterial
    });
    sceneManager.addObject(modelObj, [(Math.random() - 0.5) * 4, 8, (Math.random() - 0.5) * 4]);
    syncStateObjects();
    setSelectedObject(modelObj);
    input.attachTransform(modelObj);
    ui.syncFromSelected();
    refreshObjectList();
  } catch (err) {
    console.error("Lỗi load model:", err);
  } finally { modelInput.value = ""; }
});

// ─── Init ───
applyEnvironment(state.environment, view);
buildScene(state.currentScene);
refreshObjectList();

// ─── FPS counter (tự tạo nếu Stats.js không có) ───
let frameCount = 0;
let fpsTime = 0;
let currentFPS = 0;

const fpsDisplay = document.createElement("div");
fpsDisplay.style.cssText = "font-family:var(--mono);font-size:13px;color:#38bdf8;padding:4px 10px;background:rgba(12,18,32,0.9);border-radius:6px;border:1px solid rgba(56,189,248,0.15);";
fpsDisplay.textContent = "60 FPS";
document.getElementById("statsContainer")?.appendChild(fpsDisplay);

// ─── Render loop ───
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  const dt = clock.getDelta();
  elapsed += dt;

  frameCount++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    currentFPS = Math.round(frameCount / fpsTime);
    fpsDisplay.textContent = `${currentFPS} FPS`;
    frameCount = 0;
    fpsTime = 0;
  }

  const appliedForce = input.applyRealtimeControls(dt);
  forceVisualizers.updateForObject(state.selectedObject, appliedForce);
  collisionParticles.update(dt);

  physics.update();
  syncMeshFromBody();

  if (state.autoAnimation) {
    for (const obj of sceneManager.objects) {
      if (obj.body.mass === 0) continue;
      if (obj.animation.spinSpeed > 0) {
        obj.mesh.rotation.y += obj.animation.spinSpeed * dt;
      }
      if (obj.animation.bobAmp > 0) {
        obj.mesh.position.y += Math.sin(elapsed * obj.animation.bobFreq) * obj.animation.bobAmp * 0.015;
      }
    }
  }

  refreshDebugHelpers();
  updateHUD();

  view.controls.update();
  view.renderer.render(view.scene, view.camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("beforeunload", () => {
  input.dispose();
  forceVisualizers.dispose();
  ui.dispose();
  view.dispose();
});
