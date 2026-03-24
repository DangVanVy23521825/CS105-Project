import GUI from "lil-gui";
import Stats from "stats.js";
import * as THREE from "three";

export function createUI({
  camera,
  lights,
  onSceneChange,
  onSpawn,
  onPhysicsChange,
  onDebugChange,
  getSelected,
  setTextureForSelected,
  openImagePicker,
  onRampAngleChange
}) {
  const gui = new GUI({ title: "CS105 Controls", width: 330 });
  const stats = new Stats();
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const params = {
    scene: "Inclined Plane",
    spawnType: "Box",
    near: camera.near,
    far: camera.far,
    fov: camera.fov,
    ambient: lights.ambientLight.intensity,
    point: lights.pointLight.intensity,
    directional: lights.directionalLight.intensity,
    friction: 0.4,
    restitution: 0.35,
    rampAngleDeg: 27,
    debugMode: false,
    texturePreset: "grid",
    selectedColor: "#9ca3af",
    selectedShininess: 50,
    selectedSpecular: "#ffffff"
  };

  const sceneFolder = gui.addFolder("Scenes");
  sceneFolder
    .add(params, "scene", [
      "Inclined Plane",
      "Free Fall",
      "Horizontal Force",
      "Collision Playground"
    ])
    .name("Current Scene")
    .onChange((value) => onSceneChange(value));
  sceneFolder
    .add(params, "rampAngleDeg", 5, 55, 1)
    .name("Ramp Angle")
    .onChange((deg) => onRampAngleChange(THREE.MathUtils.degToRad(deg)));
  sceneFolder.open();

  const spawnFolder = gui.addFolder("Create Objects");
  spawnFolder
    .add(params, "spawnType", ["Box", "Sphere", "Cone", "Cylinder", "Wheel", "Teapot"])
    .name("Shape");
  spawnFolder.add({ create: () => onSpawn(params.spawnType) }, "create").name("Spawn");
  spawnFolder.open();

  const cameraFolder = gui.addFolder("Projection (Perspective)");
  cameraFolder
    .add(params, "fov", 25, 110, 1)
    .name("FOV")
    .onChange((value) => {
      camera.fov = value;
      camera.updateProjectionMatrix();
    });
  cameraFolder
    .add(params, "near", 0.01, 10, 0.01)
    .name("Near")
    .onChange((value) => {
      camera.near = value;
      if (camera.near >= camera.far) {
        camera.near = Math.max(0.01, camera.far - 0.1);
        params.near = camera.near;
      }
      camera.updateProjectionMatrix();
    });
  cameraFolder
    .add(params, "far", 20, 400, 1)
    .name("Far")
    .onChange((value) => {
      camera.far = value;
      if (camera.far <= camera.near) {
        camera.far = camera.near + 5;
        params.far = camera.far;
      }
      camera.updateProjectionMatrix();
    });

  const lightFolder = gui.addFolder("Lighting (Phong)");
  lightFolder.add(params, "ambient", 0, 2, 0.01).name("Ambient").onChange((v) => {
    lights.ambientLight.intensity = v;
  });
  lightFolder.add(params, "point", 0, 120, 1).name("Point").onChange((v) => {
    lights.pointLight.intensity = v;
  });
  lightFolder
    .add(params, "directional", 0, 2.5, 0.01)
    .name("Directional")
    .onChange((v) => {
      lights.directionalLight.intensity = v;
    });

  const physicsFolder = gui.addFolder("Physics Material");
  physicsFolder
    .add(params, "friction", 0, 1, 0.01)
    .name("Friction")
    .onChange((value) => onPhysicsChange({ friction: value, restitution: params.restitution }));
  physicsFolder
    .add(params, "restitution", 0, 1, 0.01)
    .name("Restitution")
    .onChange((value) => onPhysicsChange({ friction: params.friction, restitution: value }));

  const textureFolder = gui.addFolder("Texture Mapping");
  textureFolder
    .add(params, "texturePreset", ["grid", "wood", "metal"])
    .name("Preset")
    .onChange((name) => setTextureForSelected(name));
  textureFolder.add({ upload: openImagePicker }, "upload").name("Load bitmap");

  const selectedFolder = gui.addFolder("Selected Object");
  selectedFolder
    .addColor(params, "selectedColor")
    .name("Color")
    .onChange((value) => {
      const target = getSelected();
      if (!target) return;
      target.mesh.material.color.set(value);
    });
  selectedFolder
    .addColor(params, "selectedSpecular")
    .name("Specular")
    .onChange((value) => {
      const target = getSelected();
      if (!target) return;
      target.mesh.material.specular.set(value);
    });
  selectedFolder
    .add(params, "selectedShininess", 1, 120, 1)
    .name("Shininess")
    .onChange((value) => {
      const target = getSelected();
      if (!target) return;
      target.mesh.material.shininess = value;
    });

  gui
    .add(params, "debugMode")
    .name("Debug Mode")
    .onChange((enabled) => onDebugChange(enabled));

  function syncFromSelected() {
    const selected = getSelected();
    if (!selected) return;
    params.selectedColor = `#${selected.mesh.material.color.getHexString()}`;
    params.selectedSpecular = `#${selected.mesh.material.specular.getHexString()}`;
    params.selectedShininess = selected.mesh.material.shininess;
  }

  function dispose() {
    gui.destroy();
    stats.dom.remove();
  }

  return {
    gui,
    stats,
    params,
    syncFromSelected,
    dispose
  };
}
