import * as THREE from "three";
import { state, setSelectedObject } from "./state.js";
import { createPhysicsEngine } from "./engine/physics.js";
import { createView } from "./engine/view.js";
import { createSceneManager } from "./engine/sceneManager.js";
import { createTextureLibrary, loadTextureFromFile } from "./components/textures.js";
import { createForceVisualizers } from "./components/visualizers.js";
import { updateObjectScale } from "./components/geometries.js";
import { createInputSystem } from "./interaction/input.js";
import { createUI } from "./interaction/ui.js";
import { loadModelFromFile } from "./components/modelLoader.js";

const container = document.getElementById("app");
const overlay = document.getElementById("overlay");
const imageInput = document.getElementById("imageInput");
const modelInput = document.getElementById("modelInput");

const view = createView(container);
const physics = createPhysicsEngine();
const textureLibrary = createTextureLibrary();
const forceVisualizers = createForceVisualizers(view.scene);

const modelState = {
  textureMode: "grid",
  activeSceneMeta: null,
  equationDom: document.createElement("div"),
  customTexture: null
};
modelState.equationDom.style.marginTop = "6px";
modelState.equationDom.style.color = "#fcd34d";
overlay.appendChild(modelState.equationDom);

const sceneManager = createSceneManager({
  scene: view.scene,
  world: physics.world,
  getTexture(name) {
    if (name === "custom" && modelState.customTexture) return modelState.customTexture;
    return textureLibrary[name] ?? textureLibrary.grid;
  },
  physicsMaterial: physics.defaultMaterial
});

function updateEquationPanel() {
  const mu = physics.defaultContactMaterial.friction.toFixed(2);
  const g = Math.abs(physics.world.gravity.y).toFixed(2);
  if (state.currentScene === "Inclined Plane") {
    const thetaDeg = ui.params.rampAngleDeg.toFixed(0);
    const theta = THREE.MathUtils.degToRad(ui.params.rampAngleDeg);
    const a = physics.world.gravity.length() * Math.sin(theta) - physics.defaultContactMaterial.friction * physics.world.gravity.length() * Math.cos(theta);
    modelState.equationDom.textContent = `a = g sin(theta) - mu g cos(theta) | theta=${thetaDeg}deg | mu=${mu} | a=${a.toFixed(2)} m/s^2`;
  } else if (state.currentScene === "Free Fall") {
    modelState.equationDom.textContent = `s = 1/2 g t^2, g=${g} m/s^2 (khoi luong khac nhau, roi nhu nhau)`;
  } else if (state.currentScene === "Horizontal Force") {
    modelState.equationDom.textContent = `Luc day ngang: F - f = m a, voi f = mu N, mu=${mu}`;
  } else {
    const e = physics.defaultContactMaterial.restitution.toFixed(2);
    modelState.equationDom.textContent = `Va cham dan hoi: he so restitution e=${e}`;
  }
}

function syncStateObjects() {
  state.objects = sceneManager.objects;
}

function buildScene(name) {
  state.currentScene = name;
  modelState.activeSceneMeta = sceneManager.buildScene(name);
  setSelectedObject(null);
  syncStateObjects();
  updateEquationPanel();
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

  for (const helper of state.helpers.boxHelpers) view.scene.remove(helper);
  for (const wire of state.helpers.wireframes) view.scene.remove(wire);
  state.helpers.boxHelpers = [];
  state.helpers.wireframes = [];

  if (state.helpers.cameraHelper) {
    view.scene.remove(state.helpers.cameraHelper);
    state.helpers.cameraHelper = null;
  }

  if (!enabled) return;

  for (const obj of sceneManager.objects) {
    const boxHelper = new THREE.BoxHelper(obj.mesh, 0x22d3ee);
    state.helpers.boxHelpers.push(boxHelper);
    view.scene.add(boxHelper);

    if (obj.mesh.isMesh) {
      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(obj.mesh.geometry),
        new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 })
      );
      wire.position.copy(obj.mesh.position);
      wire.quaternion.copy(obj.mesh.quaternion);
      wire.scale.copy(obj.mesh.scale);
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
  state.helpers.wireframes.forEach((wire) => {
    const target = wire.userData.target;
    if (!target) return;
    wire.position.copy(target.position);
    wire.quaternion.copy(target.quaternion);
    wire.scale.copy(target.scale);
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

const ui = createUI({
  camera: view.camera,
  lights: view.lights,
  onSceneChange: (sceneName) => {
    buildScene(sceneName);
    toggleDebugMode(state.debugMode);
  },
  onSpawn: (type) => {
    const obj = sceneManager.spawnShape(type);
    syncStateObjects();
    setSelectedObject(obj);
    ui.syncFromSelected();
    if (state.debugMode) toggleDebugMode(true);
  },
  onPhysicsChange: ({ friction, restitution }) => {
    physics.setMaterialProps({ friction, restitution });
    updateEquationPanel();
  },
  onDebugChange: (enabled) => toggleDebugMode(enabled),
  getSelected: () => state.selectedObject,
  setTextureForSelected: (textureName) => {
    modelState.textureMode = textureName;
    applyTextureToSelected(textureName);
  },
  openImagePicker: () => imageInput.click(),
  onRampAngleChange: (angleRad) => {
    if (modelState.activeSceneMeta?.rampObject) {
      sceneManager.setRampAngle(modelState.activeSceneMeta.rampObject, angleRad);
      updateEquationPanel();
    }
  }
});

const input = createInputSystem({
  renderer: view.renderer,
  camera: view.camera,
  scene: view.scene,
  getObjects: () => sceneManager.objects,
  getSelected: () => state.selectedObject,
  setSelected: (selected) => {
    setSelectedObject(selected);
    ui.syncFromSelected();
  },
  onScale: (selected, scale) => updateObjectScale(selected, scale),
  onReset: () => {
    buildScene(state.currentScene);
    toggleDebugMode(state.debugMode);
  },
  onToggleAnimation: () => {
    state.autoAnimation = !state.autoAnimation;
  }
});

imageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    modelState.customTexture = await loadTextureFromFile(file);
    modelState.textureMode = "custom";
    applyTextureToSelected("custom");
  } catch (error) {
    console.error("Khong load duoc texture:", error);
  } finally {
    imageInput.value = "";
  }
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
    ui.syncFromSelected();
  } catch (error) {
    console.error("Khong load duoc model:", error);
  } finally {
    modelInput.value = "";
  }
});

ui.gui
  .add({ loadModelFromFile: () => modelInput.click() }, "loadModelFromFile")
  .name("Load model file");

buildScene(state.currentScene);
updateEquationPanel();

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  ui.stats.begin();
  const dt = clock.getDelta();
  elapsed += dt;

  const appliedForce = input.applyRealtimeControls(dt);
  forceVisualizers.updateForObject(state.selectedObject, appliedForce);

  physics.update();
  syncMeshFromBody();

  if (state.autoAnimation) {
    for (const obj of sceneManager.objects) {
      if (obj.body.mass === 0) continue;
      if (obj.animation.spinSpeed > 0) {
        obj.mesh.rotation.y += obj.animation.spinSpeed * dt;
      }
      if (obj.animation.bobAmp > 0) {
        obj.mesh.position.y += Math.sin(elapsed * obj.animation.bobFreq) * obj.animation.bobAmp * 0.02;
      }
    }
  }

  refreshDebugHelpers();
  view.controls.update();
  view.renderer.render(view.scene, view.camera);
  ui.stats.end();
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("beforeunload", () => {
  input.dispose();
  forceVisualizers.dispose();
  ui.dispose();
  view.dispose();
});
