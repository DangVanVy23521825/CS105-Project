import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";

export function createInputSystem({
  renderer,
  camera,
  scene,
  orbitControls,
  getObjects,
  getSelected,
  setSelected,
  onScale,
  onReset,
  onTogglePause,
  onStep,
  onToggleDebug,
  onDeleteSelected,
  onTransformModeChange,
  onForceChange
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pressed = new Set();

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setSize(0.8);
  transformControls.space = "world";
  scene.add(transformControls);

  transformControls.addEventListener("dragging-changed", (event) => {
    orbitControls.enabled = !event.value;
  });

  transformControls.addEventListener("objectChange", () => {
    const selected = getSelected();
    if (!selected) return;
    selected.body.position.set(
      selected.mesh.position.x,
      selected.mesh.position.y,
      selected.mesh.position.z
    );
    selected.body.quaternion.set(
      selected.mesh.quaternion.x,
      selected.mesh.quaternion.y,
      selected.mesh.quaternion.z,
      selected.mesh.quaternion.w
    );
    selected.body.velocity.set(0, 0, 0);
    selected.body.angularVelocity.set(0, 0, 0);
  });

  function setTransformMode(mode) {
    transformControls.setMode(mode);
  }

  function attachTransform(simObject) {
    if (simObject) transformControls.attach(simObject.mesh);
    else transformControls.detach();
  }

  function setHighlight(target, enabled) {
    if (!target) return;
    const applyEmissive = (mesh) => {
      if (!mesh.material) return;
      mesh.material.emissive = mesh.material.emissive || new THREE.Color(0);
      mesh.material.emissiveIntensity = enabled ? 0.7 : 0;
      mesh.material.emissive.set(enabled ? 0x1d4ed8 : 0x000000);
    };
    if (target.mesh.isMesh) applyEmissive(target.mesh);
    else target.mesh.traverse((child) => {
      if (child.isMesh) applyEmissive(child);
    });
  }

  function pickObject(event) {
    if (event.button !== 0 || transformControls.dragging) return;

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const meshes = [];
    for (const o of getObjects()) {
      if (o.mesh.isMesh) meshes.push(o.mesh);
      else o.mesh.traverse((c) => {
        if (c.isMesh) meshes.push(c);
      });
    }
    const hits = raycaster.intersectObjects(meshes, false);
    const previous = getSelected();

    if (hits.length === 0) {
      if (previous) {
        setHighlight(previous, false);
        setSelected(null);
        attachTransform(null);
      }
      return;
    }

    let hitMesh = hits[0].object;
    let selectedObject = getObjects().find((o) => o.mesh === hitMesh);
    if (!selectedObject) {
      selectedObject = getObjects().find((o) => {
        let found = false;
        o.mesh.traverse((c) => {
          if (c === hitMesh) found = true;
        });
        return found;
      });
    }
    if (!selectedObject) return;

    if (previous && previous !== selectedObject) setHighlight(previous, false);
    setSelected(selectedObject);
    setHighlight(selectedObject, true);
    attachTransform(selectedObject);
  }

  function handleKeyDown(event) {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") return;
    pressed.add(event.code);

    switch (event.code) {
      case "KeyP":
        onReset();
        break;
      case "Space":
        event.preventDefault();
        onTogglePause();
        break;
      case "KeyN":
        onStep();
        break;
      case "KeyB":
        onToggleDebug();
        break;
      case "Delete":
      case "Backspace":
        onDeleteSelected();
        break;
      case "KeyG":
        setTransformMode("translate");
        onTransformModeChange("translate");
        break;
      case "KeyR":
        setTransformMode("rotate");
        onTransformModeChange("rotate");
        break;
      case "KeyT":
        setTransformMode("scale");
        onTransformModeChange("scale");
        break;
      case "Slash":
      case "NumpadDivide": {
        document.getElementById("shortcutsOverlay")?.classList.toggle("show");
        break;
      }
    }
  }

  function handleKeyUp(event) {
    pressed.delete(event.code);
  }

  renderer.domElement.addEventListener("pointerdown", pickObject);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  /**
   * W/A/S/D: dat magnitude F1 theo xung nhanh theo phuong XZ (world).
   * Frame van giu nguyen — day la "phim tat thu nghiem nhanh", khong thay doi khung luc.
   */
  function applyKeyboardToForces() {
    const selected = getSelected();
    if (!selected || selected.isStatic || transformControls.dragging) return;

    let dx = 0;
    let dz = 0;
    if (pressed.has("KeyW")) dz -= 1;
    if (pressed.has("KeyS")) dz += 1;
    if (pressed.has("KeyA")) dx -= 1;
    if (pressed.has("KeyD")) dx += 1;
    if (dx !== 0 || dz !== 0) {
      // Tinh goc theo XZ de dat forceFrame F1 theo huong phim bam
      const angle = Math.atan2(dx, dz);
      // Dat forceFrame quay theo truc Y so huong W/A/S/D
      const half = angle / 2;
      const newQ = { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
      selected.forceFrame.x = newQ.x;
      selected.forceFrame.y = newQ.y;
      selected.forceFrame.z = newQ.z;
      selected.forceFrame.w = newQ.w;
      selected.forceAxes[0].enabled = true;
      selected.forceAxes[0].magnitude = 40;
      onForceChange?.();
    } else {
      // Khi tha phim, giu trang thai F1 (khong reset de tranh giat)
    }

    if (pressed.has("KeyQ")) {
      selected.mesh.rotation.y += 0.03;
      selected.body.quaternion.setFromEuler(
        selected.mesh.rotation.x,
        selected.mesh.rotation.y,
        selected.mesh.rotation.z
      );
    }
    if (pressed.has("KeyE")) {
      selected.mesh.rotation.y -= 0.03;
      selected.body.quaternion.setFromEuler(
        selected.mesh.rotation.x,
        selected.mesh.rotation.y,
        selected.mesh.rotation.z
      );
    }
    if (pressed.has("KeyZ")) onScale(selected, Math.min(selected.mesh.scale.x + 0.02, 4));
    if (pressed.has("KeyX")) onScale(selected, Math.max(selected.mesh.scale.x - 0.02, 0.2));
  }

  function dispose() {
    renderer.domElement.removeEventListener("pointerdown", pickObject);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    transformControls.dispose();
  }

  return {
    transformControls,
    setTransformMode,
    attachTransform,
    applyKeyboardToForces,
    dispose
  };
}
