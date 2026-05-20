import GUI from "lil-gui";
import * as THREE from "three";
import { axesFromQuaternion } from "../physics/forces.js";

export function createUI({
  camera,
  lights,
  onSceneChange,
  onRampAngleChange,
  getSelected,
  setTextureForSelected
}) {
  const gui = new GUI({ title: "Thuoc tinh", width: 300 });
  gui.domElement.style.position = "fixed";
  gui.domElement.style.top = "56px";
  gui.domElement.style.right = "12px";
  gui.domElement.style.zIndex = "25";

  const params = {
    near: camera.near,
    far: camera.far,
    fov: camera.fov,
    ambient: lights.ambientLight.intensity,
    point: lights.pointLight.intensity,
    directional: lights.directionalLight.intensity,
    gravity: 9.82,
    friction: 0.4,
    restitution: 0.35,
    rampAngleDeg: 27,
    mass: 2,
    F1_enabled: false,
    F1_mag: 0,
    F2_enabled: false,
    F2_mag: 0,
    F3_enabled: false,
    F3_mag: 0,
    F1_dir: "u: +X",
    F2_dir: "v: +Y",
    F3_dir: "w: +Z",
    texturePreset: "grid",
    selectedColor: "#9ca3af",
    selectedShininess: 50,
    selectedSpecular: "#ffffff"
  };

  const camFolder = gui.addFolder("Phep chieu");
  camFolder.add(params, "fov", 25, 120, 1).name("FOV").onChange((v) => {
    camera.fov = v;
    camera.updateProjectionMatrix();
  });
  camFolder.add(params, "near", 0.01, 10, 0.01).name("Near").onChange((v) => {
    camera.near = Math.min(v, camera.far - 0.1);
    params.near = camera.near;
    camera.updateProjectionMatrix();
  });
  camFolder.add(params, "far", 20, 500, 1).name("Far").onChange((v) => {
    camera.far = Math.max(v, camera.near + 5);
    params.far = camera.far;
    camera.updateProjectionMatrix();
  });

  const lightFolder = gui.addFolder("Chieu sang (Phong)");
  lightFolder.add(params, "ambient", 0, 2, 0.01).name("Ambient").onChange((v) => {
    lights.ambientLight.intensity = v;
  });
  lightFolder.add(params, "point", 0, 120, 1).name("Point").onChange((v) => {
    lights.pointLight.intensity = v;
  });
  lightFolder.add(params, "directional", 0, 3, 0.01).name("Directional").onChange((v) => {
    lights.directionalLight.intensity = v;
  });

  const sceneFolder = gui.addFolder("Canh (g, mu, e)");
  sceneFolder.add(params, "gravity", 1, 20, 0.01).name("g (m/s²)").onChange((v) => onSceneChange({ gravity: v }));
  sceneFolder.add(params, "friction", 0, 1, 0.01).name("mu mat").onChange((v) => onSceneChange({ friction: v }));
  sceneFolder.add(params, "restitution", 0, 1, 0.01).name("e va cham").onChange((v) => onSceneChange({ restitution: v }));
  sceneFolder.add(params, "rampAngleDeg", 5, 60, 1).name("Goc doc").onChange((deg) => {
    onRampAngleChange(THREE.MathUtils.degToRad(deg));
    onSceneChange({ rampAngleDeg: deg });
  });

  const forceFolder = gui.addFolder("Luc F1 F2 F3 (N)");
  forceFolder.add({ hint: "Xoay vong cam de doi huong" }, "hint").name("↺ Keo vong tron").disable();
  const f1 = forceFolder.addFolder("F1 (truc u)");
  f1.add(params, "F1_enabled").name("Bat F1").onChange(() => syncForcesToSelected());
  f1.add(params, "F1_mag", -200, 200, 1).name("|F1| (N)").onChange(() => syncForcesToSelected());
  const f1DirCtrl = f1.add(params, "F1_dir").name("Huong u").disable();
  const f2 = forceFolder.addFolder("F2 (truc v)");
  f2.add(params, "F2_enabled").name("Bat F2").onChange(() => syncForcesToSelected());
  f2.add(params, "F2_mag", -200, 200, 1).name("|F2| (N)").onChange(() => syncForcesToSelected());
  const f2DirCtrl = f2.add(params, "F2_dir").name("Huong v").disable();
  const f3 = forceFolder.addFolder("F3 (truc w)");
  f3.add(params, "F3_enabled").name("Bat F3").onChange(() => syncForcesToSelected());
  f3.add(params, "F3_mag", -200, 200, 1).name("|F3| (N)").onChange(() => syncForcesToSelected());
  const f3DirCtrl = f3.add(params, "F3_dir").name("Huong w").disable();

  const texFolder = gui.addFolder("Texture");
  texFolder
    .add(params, "texturePreset", ["grid", "wood", "metal", "brick", "marble", "checker", "lava", "grass"])
    .name("Preset")
    .onChange((name) => setTextureForSelected(name));

  const selFolder = gui.addFolder("Vat chon");
  selFolder.add(params, "mass", 0.1, 20, 0.1).name("Khoi luong").onChange((v) => {
    const t = getSelected();
    if (!t || t.isStatic) return;
    t.body.mass = v;
    t.mass = v;
    t.body.updateMassProperties();
  });
  selFolder.addColor(params, "selectedColor").name("Mau").onChange((v) => {
    const t = getSelected();
    if (!t) return;
    const apply = (m) => {
      if (m.material?.color) m.material.color.set(v);
    };
    if (t.mesh.isMesh) apply(t.mesh);
    else t.mesh.traverse((c) => {
      if (c.isMesh) apply(c);
    });
  });

  function fmtAxis(v) {
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
  }

  function updateAxisDisplay(forceFrame) {
    if (!forceFrame) return;
    const { u, v, w } = axesFromQuaternion(forceFrame);
    params.F1_dir = fmtAxis(u);
    params.F2_dir = fmtAxis(v);
    params.F3_dir = fmtAxis(w);
    f1DirCtrl.updateDisplay();
    f2DirCtrl.updateDisplay();
    f3DirCtrl.updateDisplay();
  }

  function syncForcesToSelected() {
    const sel = getSelected();
    if (!sel?.forceAxes) return;
    sel.forceAxes[0].enabled = params.F1_enabled;
    sel.forceAxes[0].magnitude = params.F1_mag;
    sel.forceAxes[1].enabled = params.F2_enabled;
    sel.forceAxes[1].magnitude = params.F2_mag;
    sel.forceAxes[2].enabled = params.F3_enabled;
    sel.forceAxes[2].magnitude = params.F3_mag;
  }

  function syncFromSelected() {
    const sel = getSelected();
    if (!sel) return;
    if (!sel.isStatic) params.mass = sel.body.mass;
    if (sel.forceAxes) {
      params.F1_enabled = sel.forceAxes[0].enabled;
      params.F1_mag    = sel.forceAxes[0].magnitude;
      params.F2_enabled = sel.forceAxes[1].enabled;
      params.F2_mag    = sel.forceAxes[1].magnitude;
      params.F3_enabled = sel.forceAxes[2].enabled;
      params.F3_mag    = sel.forceAxes[2].magnitude;
    }
    if (sel.forceFrame) updateAxisDisplay(sel.forceFrame);
    const mat = sel.mesh.isMesh ? sel.mesh.material : null;
    if (mat?.color) params.selectedColor = `#${mat.color.getHexString()}`;
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  }

  function syncSceneParams(sceneParams) {
    params.gravity = sceneParams.gravity;
    params.friction = sceneParams.friction;
    params.restitution = sceneParams.restitution;
    params.rampAngleDeg = sceneParams.rampAngleDeg;
  }

  function dispose() {
    gui.destroy();
  }

  return { gui, params, syncFromSelected, syncSceneParams, syncForcesToSelected, dispose };
}
