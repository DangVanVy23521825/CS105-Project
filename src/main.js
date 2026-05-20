import * as THREE from "three";
import { state, setSelectedObject } from "./state.js";
import { createPhysicsEngine } from "./engine/physics.js";
import { createSurfaceManager } from "./engine/surfaces.js";
import { createView } from "./engine/view.js";
import { createSceneManager } from "./engine/sceneManager.js";
import { createTextureLibrary } from "./components/textures.js";
import { createForceVisualizers, createCollisionParticles } from "./components/visualizers.js";
import { updateObjectScale } from "./components/geometries.js";
import { createInputSystem } from "./interaction/input.js";
import { createUI } from "./interaction/ui.js";
import { applyEnvironment } from "./components/environment.js";
import { applyForceAxes } from "./physics/forces.js";
import { createForceFrameControls } from "./interaction/forceFrameControls.js";
import { createVelocityGraph } from "./components/graphCanvas.js";
import {
  theoreticalRampA,
  measureAccelerationAlongRamp,
  momentum1D,
  cloneVelocity,
  fallHeight
} from "./analysis/metrics.js";

const container = document.getElementById("viewport");
const hudName = document.getElementById("hudName");
const hudPos = document.getElementById("hudPos");
const hudVel = document.getElementById("hudVel");
const hudMass = document.getElementById("hudMass");
const hudEnergy = document.getElementById("hudEnergy");
const hudFormula = document.getElementById("hudFormula");
const hudExtra = document.getElementById("hudExtra");
const forceTableBody = document.getElementById("forceTableBody");

const view = createView(container);
const physics = createPhysicsEngine();
const surfaceManager = createSurfaceManager(physics.world, physics.experimentMaterial);
const textureLibrary = createTextureLibrary();
const forceVisualizers = createForceVisualizers(view.scene);
const collisionParticles = createCollisionParticles(view.scene);

const modelState = { activeSceneMeta: null, sceneStartTime: 0 };
let prevVelocity = null;
let measuredA = 0;

const graphCanvas = document.getElementById("vtGraph");
const velocityGraph = graphCanvas ? createVelocityGraph(graphCanvas) : null;

const forceFrameControls = createForceFrameControls({
  renderer: view.renderer,
  camera: view.camera,
  scene: view.scene,
  orbitControls: view.controls
});

const sceneManager = createSceneManager({
  scene: view.scene,
  world: physics.world,
  getTexture: (name) => textureLibrary[name] ?? textureLibrary.grid,
  physicsMaterial: {
    defaultMaterial: physics.defaultMaterial,
    experimentMaterial: physics.experimentMaterial
  },
  surfaceManager
});

physics.onCollision((contact) => {
  const impulse = contact.getImpactVelocityAlongNormal?.();
  if (impulse !== undefined && Math.abs(impulse) > 4) {
    const pt = contact.bi.position;
    collisionParticles.spawn(new THREE.Vector3(pt.x, pt.y, pt.z), 0xffa500);
  }
  if (state.currentScene === "Collision Playground" && state.metrics.collisionMomentumBefore === null) {
    state.metrics.collisionMomentumBefore = momentum1D(sceneManager.getExperimentObjects());
  }
  if (state.currentScene === "Collision Playground") {
    setTimeout(() => {
      state.metrics.collisionMomentumAfter = momentum1D(sceneManager.getExperimentObjects());
    }, 50);
  }
});

document.querySelectorAll(".scene-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".scene-card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    buildScene(card.dataset.scene);
    toggleDebugMode(state.debugMode);
  });
});

document.querySelectorAll(".spawn-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const obj = sceneManager.spawnShape(btn.dataset.shape);
    if (!obj) {
      alert(`Toi da ${sceneManager.MAX_USER_SPAWN} vat thi nghiem them trong canh.`);
      return;
    }
    syncStateObjects();
    setSelectedObject(obj);
    input.attachTransform(obj);
    forceFrameControls.attach(obj, () => ui.syncFromSelected());
    ui.syncFromSelected();
    refreshObjectList();
  });
});

document.getElementById("btnReset")?.addEventListener("click", resetBodies);
document.getElementById("btnScreenshot")?.addEventListener("click", takeScreenshot);
document.getElementById("btnPause")?.addEventListener("click", togglePause);
document.getElementById("btnStep")?.addEventListener("click", () => {
  state.stepOnce = true;
});
document.getElementById("btnShortcuts")?.addEventListener("click", () => {
  document.getElementById("shortcutsOverlay")?.classList.toggle("show");
});
document.getElementById("shortcutsOverlay")?.addEventListener("click", (e) => {
  if (e.target.id === "shortcutsOverlay") e.target.classList.remove("show");
});

document.querySelectorAll(".tf-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tf-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.transformMode = btn.dataset.mode;
    input.setTransformMode(btn.dataset.mode);
  });
});

function syncStateObjects() {
  state.objects = sceneManager.objects;
}

function getGravityVec() {
  const g = physics.world.gravity;
  return { x: g.x, y: g.y, z: g.z };
}

function onSceneParamsChange({ gravity, friction, restitution, rampAngleDeg }) {
  if (typeof gravity === "number") {
    state.sceneParams.gravity = gravity;
    physics.setGravity(0, -gravity, 0);
  }
  if (typeof friction === "number") {
    state.sceneParams.friction = friction;
    surfaceManager.setActiveSurfaceFriction(friction);
  }
  if (typeof restitution === "number") {
    state.sceneParams.restitution = restitution;
    physics.setRestitution(restitution);
  }
  if (typeof rampAngleDeg === "number") state.sceneParams.rampAngleDeg = rampAngleDeg;
  updateFormula();
}

function buildScene(name) {
  state.currentScene = name;
  state.metrics.collisionMomentumBefore = null;
  state.metrics.collisionMomentumAfter = null;
  state.metrics.fallStartTime = performance.now() / 1000;
  modelState.sceneStartTime = state.metrics.fallStartTime;
  modelState.activeSceneMeta = sceneManager.buildScene(name);
  setSelectedObject(null);
  input.attachTransform(null);
  forceFrameControls.detach();
  syncStateObjects();
  ui.syncSceneParams(state.sceneParams);
  onSceneParamsChange(state.sceneParams);
  if (modelState.activeSceneMeta?.rampObject) {
    sceneManager.setRampAngle(
      modelState.activeSceneMeta.rampObject,
      THREE.MathUtils.degToRad(state.sceneParams.rampAngleDeg)
    );
  }
  prevVelocity = null;
  velocityGraph?.clear();
  updateFormula();
  refreshObjectList();
  refreshForceTable([]);
}

function resetBodies() {
  sceneManager.resetBodies();
  state.metrics.collisionMomentumBefore = null;
  state.metrics.collisionMomentumAfter = null;
  state.metrics.fallStartTime = performance.now() / 1000;
  prevVelocity = null;
  velocityGraph?.clear();
}

function togglePause() {
  state.simulationPaused = !state.simulationPaused;
  const btn = document.getElementById("btnPause");
  if (btn) btn.textContent = state.simulationPaused ? "Tiep tuc" : "Tam dung";
}

function updateFormula() {
  const mu = surfaceManager.getActiveFriction().toFixed(2);
  const g = Math.abs(physics.world.gravity.y).toFixed(2);
  const e = physics.experimentSelfContact.restitution.toFixed(2);
  const theta = THREE.MathUtils.degToRad(state.sceneParams.rampAngleDeg);
  const gVal = physics.world.gravity.length();

  switch (state.currentScene) {
    case "Inclined Plane": {
      const aTh = theoreticalRampA(gVal, theta, parseFloat(mu));
      hudFormula.textContent = `a_lt=${aTh.toFixed(2)} a_do=${measuredA.toFixed(2)} m/s² | θ=${state.sceneParams.rampAngleDeg}° μ=${mu}`;
      break;
    }
    case "Free Fall":
      hudFormula.textContent = `s=½gt² | g=${g} m/s² — Galileo: khối lượng khác, rơi cùng g`;
      break;
    case "Horizontal Force":
      hudFormula.textContent = `F−f=ma | f=μN | μ=${mu}`;
      break;
    case "Collision Playground": {
      const pB = state.metrics.collisionMomentumBefore;
      const pA = state.metrics.collisionMomentumAfter;
      const extra =
        pB !== null && pA !== null
          ? ` | p_truoc=${pB.toFixed(1)} p_sau=${pA.toFixed(1)} kg·m/s`
          : "";
      hudFormula.textContent = `m₁v₁+m₂v₂=const | e=${e}${extra}`;
      break;
    }
    default:
      hudFormula.textContent = "—";
  }
}

function refreshForceTable(rows) {
  if (!forceTableBody) return;
  forceTableBody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.name}</td><td>${r.mag.toFixed(1)}</td><td>(${r.x.toFixed(0)},${r.y.toFixed(0)},${r.z.toFixed(0)})</td>`;
    forceTableBody.appendChild(tr);
  }
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
    if (obj.mesh.isMesh && obj.mesh.geometry) {
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
    item.mesh.quaternion.set(
      item.body.quaternion.x,
      item.body.quaternion.y,
      item.body.quaternion.z,
      item.body.quaternion.w
    );
  }
}

function applyAllCustomForces() {
  for (const obj of sceneManager.objects) {
    if (obj.role === "experiment" && !obj.isStatic) {
      applyForceAxes(obj.body, obj.forceFrame, obj.forceAxes);
    }
  }
}

function takeScreenshot() {
  view.renderer.render(view.scene, view.camera);
  const link = document.createElement("a");
  link.download = `CS105_${Date.now()}.png`;
  link.href = view.renderer.domElement.toDataURL("image/png");
  link.click();
}

function refreshObjectList() {
  const listEl = document.getElementById("objectList");
  if (!listEl) return;
  listEl.innerHTML = "";
  for (const obj of sceneManager.objects) {
    if (obj.role === "surface") continue;
    const el = document.createElement("div");
    el.className = "obj-item" + (obj === state.selectedObject ? " active" : "");
    const nameSpan = document.createElement("span");
    nameSpan.className = "obj-name";
    nameSpan.innerHTML = `<span class="obj-dot"></span>${obj.label || obj.kind}`;
    el.appendChild(nameSpan);

    if (!obj.isStatic && obj.spawnedByUser) {
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
      el.appendChild(delBtn);
    }

    el.addEventListener("click", () => {
      setSelectedObject(obj);
      input.attachTransform(obj);
      if (obj.role === "experiment" && !obj.isStatic) {
        forceFrameControls.attach(obj, () => ui.syncFromSelected());
      } else {
        forceFrameControls.detach();
      }
      ui.syncFromSelected();
      refreshObjectList();
    });
    listEl.appendChild(el);
  }
}

function updateHUD() {
  const sel = state.selectedObject;
  if (!sel || sel.role === "surface") {
    hudName.textContent = "—";
    hudPos.textContent = "—";
    hudVel.textContent = "—";
    hudMass.textContent = "—";
    hudEnergy.textContent = "—";
    if (hudExtra) hudExtra.textContent = "";
    return;
  }

  hudName.textContent = sel.label || sel.kind;
  const p = sel.body.position;
  hudPos.textContent = `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;
  const v = sel.body.velocity;
  const speed = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  hudVel.textContent = `${speed.toFixed(2)} m/s`;
  hudMass.textContent = `${sel.body.mass.toFixed(1)} kg`;
  const ke = 0.5 * sel.body.mass * speed * speed;
  const pe = sel.body.mass * Math.abs(physics.world.gravity.y) * Math.max(0, p.y);
  hudEnergy.textContent = `KE=${ke.toFixed(1)} PE=${pe.toFixed(1)} J`;

  let extra = "";
  if (state.currentScene === "Free Fall" && modelState.activeSceneMeta?.fallY0) {
    const t = performance.now() / 1000 - state.metrics.fallStartTime;
    const s = fallHeight(modelState.activeSceneMeta.fallY0, p.y);
    extra = `t=${t.toFixed(2)}s s=${s.toFixed(2)}m`;
  }
  if (state.currentScene === "Inclined Plane") {
    extra = `a_do=${measuredA.toFixed(2)} m/s²`;
  }
  if (hudExtra) hudExtra.textContent = extra;
}

const ui = createUI({
  camera: view.camera,
  lights: view.lights,
  onSceneChange: onSceneParamsChange,
  onRampAngleChange: (angleRad) => {
    if (modelState.activeSceneMeta?.rampObject) {
      sceneManager.setRampAngle(modelState.activeSceneMeta.rampObject, angleRad);
    }
    updateFormula();
  },
  getSelected: () => state.selectedObject,
  setTextureForSelected: () => {}
});

const input = createInputSystem({
  renderer: view.renderer,
  camera: view.camera,
  scene: view.scene,
  orbitControls: view.controls,
  getObjects: () => sceneManager.getExperimentObjects(),
  getSelected: () => state.selectedObject,
  setSelected: (selected) => {
    setSelectedObject(selected);
    if (selected?.role === "experiment" && !selected.isStatic) {
      forceFrameControls.attach(selected, () => ui.syncFromSelected());
    } else {
      forceFrameControls.detach();
    }
    ui.syncFromSelected();
    refreshObjectList();
  },
  onScale: (selected, scale) => updateObjectScale(selected, scale),
  onReset: resetBodies,
  onTogglePause: togglePause,
  onStep: () => {
    state.stepOnce = true;
  },
  onToggleDebug: () => toggleDebugMode(!state.debugMode),
  onDeleteSelected: () => {
    if (!state.selectedObject?.spawnedByUser) return;
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
  },
  onForceChange: () => ui.syncFromSelected()
});

applyEnvironment("day", view);
ui.syncSceneParams(state.sceneParams);
buildScene(state.currentScene);

const fpsDisplay = document.createElement("div");
fpsDisplay.style.cssText =
  "font-family:var(--mono);font-size:13px;color:#38bdf8;padding:4px 10px;background:rgba(12,18,32,0.9);border-radius:6px;border:1px solid rgba(56,189,248,0.15);";
fpsDisplay.textContent = "60 FPS";
document.getElementById("statsContainer")?.appendChild(fpsDisplay);

const clock = new THREE.Clock();
let frameCount = 0;
let fpsTime = 0;

function animate() {
  const rawDt = clock.getDelta();
  const dt = rawDt * state.timeScale;

  frameCount++;
  fpsTime += rawDt;
  if (fpsTime >= 0.5) {
    fpsDisplay.textContent = `${Math.round(frameCount / fpsTime)} FPS`;
    frameCount = 0;
    fpsTime = 0;
  }

  const runPhysics = !state.simulationPaused || state.stepOnce;
  if (runPhysics) {
    input.applyKeyboardToForces();
    applyAllCustomForces();
    physics.update();
    state.stepOnce = false;
  }

  syncMeshFromBody();

  const sel = state.selectedObject;
  const mu = surfaceManager.getActiveFriction();
  const gVec = getGravityVec();

  if (sel && sel.role === "experiment") {
    if (prevVelocity && runPhysics) {
      const theta = THREE.MathUtils.degToRad(state.sceneParams.rampAngleDeg);
      measuredA = measureAccelerationAlongRamp(sel.body, prevVelocity, dt, theta);
    }
    prevVelocity = cloneVelocity(sel.body);

    const tNow = performance.now() / 1000;
    const speed = Math.sqrt(
      sel.body.velocity.x ** 2 + sel.body.velocity.y ** 2 + sel.body.velocity.z ** 2
    );
    velocityGraph?.push(tNow, speed);
    velocityGraph?.draw();

    const { rows } = forceVisualizers.updateForObject(sel, gVec, mu);
    refreshForceTable(rows);
  } else {
    forceVisualizers.updateForObject(null, gVec, mu);
    refreshForceTable([]);
  }

  collisionParticles.update(dt);
  refreshDebugHelpers();
  updateHUD();
  updateFormula();

  forceFrameControls.update();
  view.controls.update();
  view.renderer.render(view.scene, view.camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("beforeunload", () => {
  input.dispose();
  forceFrameControls.dispose();
  forceVisualizers.dispose();
  ui.dispose();
  view.dispose();
});
