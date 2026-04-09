import GUI from "lil-gui";
import * as THREE from "three";

export function createUI({
  camera,
  lights,
  onPhysicsChange,
  getSelected,
  setTextureForSelected,
  onRampAngleChange
}) {
  const gui = new GUI({ title: "⚙ Properties", width: 300 });
  gui.domElement.style.position = "fixed";
  gui.domElement.style.top = "56px";
  gui.domElement.style.right = "12px";
  gui.domElement.style.zIndex = "25";

  // ─── Stats.js (FPS) ───
  const statsContainer = document.getElementById("statsContainer");
  let stats = null;
  try {
    const StatsModule = window.Stats || null;
    if (StatsModule) {
      stats = new StatsModule();
      stats.showPanel(0);
      statsContainer?.appendChild(stats.dom);
    }
  } catch (_) { /* fallback: no stats */ }

  const params = {
    near: camera.near,
    far: camera.far,
    fov: camera.fov,
    ambient: lights.ambientLight.intensity,
    point: lights.pointLight.intensity,
    directional: lights.directionalLight.intensity,
    friction: 0.4,
    restitution: 0.35,
    rampAngleDeg: 27,
    texturePreset: "grid",
    selectedColor: "#9ca3af",
    selectedShininess: 50,
    selectedSpecular: "#ffffff"
  };

  // ─── Camera / Projection ───
  const camFolder = gui.addFolder("📷 Phép chiếu phối cảnh");
  camFolder.add(params, "fov", 25, 120, 1).name("FOV").onChange((v) => {
    camera.fov = v; camera.updateProjectionMatrix();
  });
  camFolder.add(params, "near", 0.01, 10, 0.01).name("Near").onChange((v) => {
    camera.near = Math.min(v, camera.far - 0.1); params.near = camera.near;
    camera.updateProjectionMatrix();
  });
  camFolder.add(params, "far", 20, 500, 1).name("Far").onChange((v) => {
    camera.far = Math.max(v, camera.near + 5); params.far = camera.far;
    camera.updateProjectionMatrix();
  });

  // ─── Lighting ───
  const lightFolder = gui.addFolder("💡 Chiếu sáng (Phong)");
  lightFolder.add(params, "ambient", 0, 2, 0.01).name("Ambient").onChange((v) => { lights.ambientLight.intensity = v; });
  lightFolder.add(params, "point", 0, 120, 1).name("Point Light").onChange((v) => { lights.pointLight.intensity = v; });
  lightFolder.add(params, "directional", 0, 3, 0.01).name("Directional").onChange((v) => { lights.directionalLight.intensity = v; });

  // ─── Physics ───
  const physFolder = gui.addFolder("⚡ Vật liệu vật lý");
  physFolder.add(params, "friction", 0, 1, 0.01).name("Ma sát μ").onChange((v) => onPhysicsChange({ friction: v, restitution: params.restitution }));
  physFolder.add(params, "restitution", 0, 1, 0.01).name("Đàn hồi e").onChange((v) => onPhysicsChange({ friction: params.friction, restitution: v }));
  physFolder.add(params, "rampAngleDeg", 5, 60, 1).name("Góc ramp θ°").onChange((deg) => onRampAngleChange(THREE.MathUtils.degToRad(deg)));

  // ─── Texture ───
  const texFolder = gui.addFolder("🖼️ Texture Mapping");
  texFolder.add(params, "texturePreset", ["grid", "wood", "metal", "brick", "marble", "checker", "lava", "grass"]).name("Preset").onChange((name) => setTextureForSelected(name));

  // ─── Selected Object ───
  const selFolder = gui.addFolder("🎯 Đối tượng đang chọn");
  selFolder.addColor(params, "selectedColor").name("Màu sắc").onChange((v) => {
    const t = getSelected();
    if (!t) return;
    const apply = (m) => { if (m.material?.color) m.material.color.set(v); };
    if (t.mesh.isMesh) apply(t.mesh); else t.mesh.traverse((c) => { if (c.isMesh) apply(c); });
  });
  selFolder.addColor(params, "selectedSpecular").name("Specular").onChange((v) => {
    const t = getSelected();
    if (!t) return;
    const apply = (m) => { if (m.material?.specular) m.material.specular.set(v); };
    if (t.mesh.isMesh) apply(t.mesh); else t.mesh.traverse((c) => { if (c.isMesh) apply(c); });
  });
  selFolder.add(params, "selectedShininess", 1, 128, 1).name("Shininess").onChange((v) => {
    const t = getSelected();
    if (!t) return;
    const apply = (m) => { if (m.material) m.material.shininess = v; };
    if (t.mesh.isMesh) apply(t.mesh); else t.mesh.traverse((c) => { if (c.isMesh) apply(c); });
  });

  function syncFromSelected() {
    const sel = getSelected();
    if (!sel) return;
    const mat = sel.mesh.isMesh ? sel.mesh.material : null;
    if (mat) {
      params.selectedColor = `#${mat.color.getHexString()}`;
      params.selectedSpecular = `#${(mat.specular || new THREE.Color(0xffffff)).getHexString()}`;
      params.selectedShininess = mat.shininess || 50;
    }
  }

  function dispose() {
    gui.destroy();
    stats?.dom?.remove();
  }

  return { gui, stats, params, syncFromSelected, dispose };
}
