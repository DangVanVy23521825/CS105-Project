import * as THREE from "three";

export function createForceVisualizers(scene) {
  const gravity = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 8, 0),
    4,
    0x60a5fa
  );
  const applied = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    0,
    0xf97316
  );
  const normal = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    0,
    0x34d399
  );

  gravity.visible = true;
  applied.visible = false;
  normal.visible = false;

  scene.add(gravity);
  scene.add(applied);
  scene.add(normal);

  function updateForObject(simObject, appliedForceVector) {
    if (!simObject) {
      applied.visible = false;
      normal.visible = false;
      return;
    }
    const p = simObject.mesh.position;
    const forceLen = appliedForceVector.length();

    if (forceLen > 0.01) {
      applied.visible = true;
      applied.position.set(p.x, p.y + 1.2, p.z);
      applied.setDirection(appliedForceVector.clone().normalize());
      applied.setLength(Math.min(forceLen * 0.05, 4), 0.3, 0.2);
    } else {
      applied.visible = false;
    }

    normal.visible = true;
    normal.position.set(p.x, p.y + 0.2, p.z);
    normal.setDirection(new THREE.Vector3(0, 1, 0));
    normal.setLength(2.2, 0.24, 0.12);
  }

  function dispose() {
    scene.remove(gravity, applied, normal);
  }

  return {
    arrows: { gravity, applied, normal },
    updateForObject,
    dispose
  };
}
