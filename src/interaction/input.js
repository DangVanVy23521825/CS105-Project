import * as THREE from "three";
import * as CANNON from "cannon-es";
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
  onToggleAnimation,
  onToggleDebug,
  onDeleteSelected,
  onTransformModeChange
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pressed = new Set();
  const forceVector = new THREE.Vector3();

  // ─── TransformControls: cho phep keo/quay/scale bang chuot ───
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
    if (simObject) {
      transformControls.attach(simObject.mesh);
    } else {
      transformControls.detach();
    }
  }

  function setHighlight(target, enabled) {
    if (!target) return;
    const applyEmissive = (mesh) => {
      if (!mesh.material) return;
      mesh.material.emissive = mesh.material.emissive || new THREE.Color(0);
      mesh.material.emissiveIntensity = enabled ? 0.7 : 0;
      mesh.material.emissive.set(enabled ? 0x1d4ed8 : 0x000000);
    };
    if (target.mesh.isMesh) {
      applyEmissive(target.mesh);
    } else {
      target.mesh.traverse((child) => { if (child.isMesh) applyEmissive(child); });
    }
  }

  function pickObject(event) {
    if (event.button !== 0) return;
    if (transformControls.dragging) return;

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const meshes = [];
    for (const o of getObjects()) {
      if (o.mesh.isMesh) meshes.push(o.mesh);
      else o.mesh.traverse((c) => { if (c.isMesh) meshes.push(c); });
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
        o.mesh.traverse((c) => { if (c === hitMesh) found = true; });
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
      case "KeyP": onReset(); break;
      case "KeyF": onToggleAnimation(); break;
      case "KeyB": onToggleDebug(); break;
      case "Delete":
      case "Backspace": onDeleteSelected(); break;
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
        const overlay = document.getElementById("shortcutsOverlay");
        overlay?.classList.toggle("show");
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

  function applyRealtimeControls(dt) {
    forceVector.set(0, 0, 0);
    const selected = getSelected();
    if (!selected || selected.body.mass === 0) return forceVector;
    if (transformControls.dragging) return forceVector;

    const forceValue = 60;
    if (pressed.has("KeyW")) forceVector.z -= forceValue;
    if (pressed.has("KeyS")) forceVector.z += forceValue;
    if (pressed.has("KeyA")) forceVector.x -= forceValue;
    if (pressed.has("KeyD")) forceVector.x += forceValue;
    if (pressed.has("Space")) {
      selected.body.applyForce(new CANNON.Vec3(0, 180, 0), selected.body.position);
    }

    if (forceVector.lengthSq() > 0.0001) {
      selected.body.applyForce(
        new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z),
        selected.body.position
      );
    }

    const rotateSpeed = 1.8;
    if (pressed.has("KeyQ")) {
      selected.mesh.rotation.y += rotateSpeed * dt;
      selected.body.quaternion.setFromEuler(selected.mesh.rotation.x, selected.mesh.rotation.y, selected.mesh.rotation.z);
    }
    if (pressed.has("KeyE")) {
      selected.mesh.rotation.y -= rotateSpeed * dt;
      selected.body.quaternion.setFromEuler(selected.mesh.rotation.x, selected.mesh.rotation.y, selected.mesh.rotation.z);
    }

    if (pressed.has("KeyZ")) {
      const s = Math.min(selected.mesh.scale.x + dt, 4);
      onScale(selected, s);
    }
    if (pressed.has("KeyX")) {
      const s = Math.max(selected.mesh.scale.x - dt, 0.2);
      onScale(selected, s);
    }

    return forceVector;
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
    applyRealtimeControls,
    dispose
  };
}
