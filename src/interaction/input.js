import * as THREE from "three";
import * as CANNON from "cannon-es";

export function createInputSystem({
  renderer,
  camera,
  scene,
  getObjects,
  getSelected,
  setSelected,
  onScale,
  onReset,
  onToggleAnimation
}) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pressed = new Set();
  const forceVector = new THREE.Vector3();

  function setHighlight(target, enabled) {
    if (!target) return;
    const mat = target.mesh.material;
    mat.emissive = mat.emissive || new THREE.Color(0x000000);
    mat.emissiveIntensity = enabled ? 0.75 : 0.2;
    mat.emissive.set(enabled ? 0x1d4ed8 : 0x000000);
  }

  function pickObject(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const meshes = getObjects().map((o) => o.mesh);
    const hits = raycaster.intersectObjects(meshes, false);

    const previous = getSelected();
    if (hits.length === 0) {
      if (previous) {
        setHighlight(previous, false);
        setSelected(null);
      }
      return;
    }

    const selectedMesh = hits[0].object;
    const selectedObject = getObjects().find((o) => o.mesh === selectedMesh);
    if (!selectedObject) return;

    if (previous && previous !== selectedObject) {
      setHighlight(previous, false);
    }
    setSelected(selectedObject);
    setHighlight(selectedObject, true);
  }

  function handleKeyDown(event) {
    pressed.add(event.code);
    if (event.code === "KeyR") onReset();
    if (event.code === "KeyF") onToggleAnimation();
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
    if (!selected) return forceVector;

    const forceValue = 60;
    if (pressed.has("KeyW")) forceVector.z -= forceValue;
    if (pressed.has("KeyS")) forceVector.z += forceValue;
    if (pressed.has("KeyA")) forceVector.x -= forceValue;
    if (pressed.has("KeyD")) forceVector.x += forceValue;

    if (forceVector.lengthSq() > 0.0001) {
      selected.body.applyForce(
        new CANNON.Vec3(forceVector.x, forceVector.y, forceVector.z),
        selected.body.position
      );
    }

    const rotateSpeed = 1.8;
    if (pressed.has("KeyQ")) {
      selected.mesh.rotation.y += rotateSpeed * dt;
      selected.body.quaternion.setFromEuler(
        selected.mesh.rotation.x,
        selected.mesh.rotation.y,
        selected.mesh.rotation.z
      );
    }
    if (pressed.has("KeyE")) {
      selected.mesh.rotation.y -= rotateSpeed * dt;
      selected.body.quaternion.setFromEuler(
        selected.mesh.rotation.x,
        selected.mesh.rotation.y,
        selected.mesh.rotation.z
      );
    }

    if (pressed.has("KeyZ")) {
      const s = Math.min(selected.mesh.scale.x + dt, 3);
      onScale(selected, s);
    }
    if (pressed.has("KeyX")) {
      const s = Math.max(selected.mesh.scale.x - dt, 0.35);
      onScale(selected, s);
    }

    return forceVector;
  }

  function dispose() {
    renderer.domElement.removeEventListener("pointerdown", pickObject);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  }

  return {
    applyRealtimeControls,
    dispose
  };
}
