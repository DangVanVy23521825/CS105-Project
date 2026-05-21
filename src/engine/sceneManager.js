import * as CANNON from "cannon-es";
import {
  createBox,
  createCapsule,
  createCone,
  createCylinder,
  createDodecahedron,
  createGround,
  createSphere,
  createTeapot,
  createTorusKnot,
  createWheel
} from "../components/geometries.js";
import { cloneVelocity } from "../analysis/metrics.js";

const MAX_USER_SPAWN = 3;

function disposeMesh(mesh) {
  mesh.traverse?.((child) => {
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
    else if (child.material) child.material.dispose();
  });
}

function snapshotBody(item) {
  return {
    position: [item.body.position.x, item.body.position.y, item.body.position.z],
    quaternion: [item.body.quaternion.x, item.body.quaternion.y, item.body.quaternion.z, item.body.quaternion.w],
    velocity: cloneVelocity(item.body),
    angularVelocity: {
      x: item.body.angularVelocity.x,
      y: item.body.angularVelocity.y,
      z: item.body.angularVelocity.z
    }
  };
}

export function createSceneManager({ scene, world, getTexture, physicsMaterial, surfaceManager }) {
  const objects = [];
  let initialStates = [];

  function decorateExperiment(item, label) {
    item.role = "experiment";
    item.isStatic = false;
    item.label = label;
    item.spawnedByUser = false;
    item.body.material = physicsMaterial.experimentMaterial;
    return item;
  }

  function addObject(item, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const [x, y, z] = position;
    const [rx, ry, rz] = rotation;
    item.body.position.set(x, y, z);
    item.body.quaternion.setFromEuler(rx, ry, rz);
    item.mesh.position.set(x, y, z);
    item.mesh.rotation.set(rx, ry, rz);
    scene.add(item.mesh);
    world.addBody(item.body);
    objects.push(item);
    return item;
  }

  /**
   * Dong bo vi tri + quaternion tu physics body sang mesh Three.js.
   * Day la buoc cuoi cua pipeline: physics step -> cap nhat do hoa.
   */
  function syncMeshesFromBodies() {
    for (const item of objects) {
      item.mesh.position.set(item.body.position.x, item.body.position.y, item.body.position.z);
      item.mesh.quaternion.set(
        item.body.quaternion.x,
        item.body.quaternion.y,
        item.body.quaternion.z,
        item.body.quaternion.w
      );
    }
  }

  function removeObject(item) {
    const idx = objects.indexOf(item);
    if (idx >= 0) objects.splice(idx, 1);
    world.removeBody(item.body);
    scene.remove(item.mesh);
    disposeMesh(item.mesh);
  }

  function clearAll() {
    for (const item of [...objects]) removeObject(item);
    surfaceManager?.clear();
    initialStates = [];
  }

  function saveInitialStates() {
    initialStates = objects.map((o) => ({
      ref: o,
      ...snapshotBody(o)
    }));
  }

  function countUserSpawned() {
    return objects.filter((o) => o.spawnedByUser && o.role === "experiment").length;
  }

  // --- Scene 1: Mat phang nghieng ---
  function initInclinedPlane() {
    const ground = createGround({ width: 42, depth: 42, texture: getTexture("grid"), physicsMaterial: physicsMaterial.defaultMaterial, label: "San" });
    addObject(ground, [0, -0.4, 0]);
    surfaceManager.registerSurface(ground, { friction: 0.4, label: "San" });

    const ramp = createBox({
      width: 14,
      height: 0.7,
      depth: 9,
      mass: 0,
      texture: getTexture("wood"),
      color: 0xb08968,
      physicsMaterial: physicsMaterial.defaultMaterial,
      label: "Mat phang nghieng",
      role: "surface"
    });
    const theta = Math.PI * 0.15;
    addObject(ramp, [0, 2.5, -1], [0, 0, -theta]);
    surfaceManager.registerSurface(ramp, { friction: 0.4, label: "Mat phang nghieng" });

    const box = createBox({ width: 1.2, height: 1.2, depth: 1.2, mass: 2, texture: getTexture("metal"), color: 0x94a3b8, physicsMaterial: physicsMaterial.experimentMaterial, label: "Hop 2 kg" });
    decorateExperiment(box, "Hop 2 kg");
    addObject(box, [0, 5.5, -1]);

    const sphere = createSphere({ radius: 0.85, mass: 1.5, texture: getTexture("grid"), color: 0x93c5fd, physicsMaterial: physicsMaterial.experimentMaterial, label: "Cau 1.5 kg" });
    decorateExperiment(sphere, "Cau 1.5 kg");
    addObject(sphere, [2, 6, -1]);

    saveInitialStates();
    surfaceManager.pickActiveForScene("Inclined Plane");
    return { name: "Inclined Plane", rampObject: ramp };
  }

  // --- Scene 2: Roi tu do ---
  function initFreeFall() {
    const ground = createGround({ width: 40, depth: 40, texture: getTexture("grid"), physicsMaterial: physicsMaterial.defaultMaterial, label: "San" });
    addObject(ground, [0, -0.4, 0]);
    surfaceManager.registerSurface(ground, { friction: 0.3, label: "San" });

    const sphere = createSphere({ radius: 0.9, mass: 1, texture: getTexture("metal"), color: 0x38bdf8, physicsMaterial: physicsMaterial.experimentMaterial, label: "Cau 1 kg" });
    decorateExperiment(sphere, "Cau 1 kg");
    addObject(sphere, [-2, 12, 0]);

    const box = createBox({ width: 1.2, height: 1.2, depth: 1.2, mass: 4, texture: getTexture("wood"), color: 0xfbbf24, physicsMaterial: physicsMaterial.experimentMaterial, label: "Hop 4 kg" });
    decorateExperiment(box, "Hop 4 kg");
    addObject(box, [2, 12, 0]);

    saveInitialStates();
    surfaceManager.pickActiveForScene("Free Fall");
    return { name: "Free Fall", fallY0: 12 };
  }

  // --- Scene 3: Luc ngang & ma sat ---
  function initHorizontalForce() {
    const ground = createGround({ width: 50, depth: 50, texture: getTexture("grid"), physicsMaterial: physicsMaterial.defaultMaterial, label: "San" });
    addObject(ground, [0, -0.4, 0]);
    surfaceManager.registerSurface(ground, { friction: 0.4, label: "San" });

    const box = createBox({ width: 1.4, height: 1.2, depth: 1.4, mass: 2, texture: getTexture("wood"), color: 0xf8fafc, physicsMaterial: physicsMaterial.experimentMaterial, label: "Hop 2 kg" });
    decorateExperiment(box, "Hop 2 kg");
    addObject(box, [0, 1.2, 0]);

    saveInitialStates();
    surfaceManager.pickActiveForScene("Horizontal Force");
    return { name: "Horizontal Force" };
  }

  // --- Scene 4: Va cham ---
  function initCollisionPlayground() {
    const ground = createGround({ width: 48, depth: 48, texture: getTexture("grid"), physicsMaterial: physicsMaterial.defaultMaterial, label: "San" });
    addObject(ground, [0, -0.4, 0]);
    surfaceManager.registerSurface(ground, { friction: 0.2, label: "San" });

    const a = createSphere({ radius: 1, mass: 2, texture: getTexture("metal"), color: 0x38bdf8, physicsMaterial: physicsMaterial.experimentMaterial, label: "Cau A" });
    decorateExperiment(a, "Cau A");
    addObject(a, [-6, 2, 0]);
    a.body.velocity.set(8, 0, 0);

    const b = createSphere({ radius: 1, mass: 3, texture: getTexture("metal"), color: 0xf97316, physicsMaterial: physicsMaterial.experimentMaterial, label: "Cau B" });
    decorateExperiment(b, "Cau B");
    addObject(b, [6, 2, 0]);
    b.body.velocity.set(-8, 0, 0);

    saveInitialStates();
    surfaceManager.pickActiveForScene("Collision Playground");
    return { name: "Collision Playground" };
  }

  function buildScene(sceneName) {
    clearAll();
    switch (sceneName) {
      case "Inclined Plane":
        return initInclinedPlane();
      case "Free Fall":
        return initFreeFall();
      case "Horizontal Force":
        return initHorizontalForce();
      case "Collision Playground":
        return initCollisionPlayground();
      default:
        return initInclinedPlane();
    }
  }

  const SPAWN_MAP = {
    Box: createBox,
    Sphere: createSphere,
    Cone: createCone,
    Cylinder: createCylinder,
    Wheel: createWheel,
    Teapot: createTeapot,
    TorusKnot: createTorusKnot,
    Dodecahedron: createDodecahedron,
    Capsule: createCapsule
  };

  const SPAWN_LABELS = {
    Box: "Hộp",
    Sphere: "Cầu",
    Cone: "Nón",
    Cylinder: "Trụ",
    Wheel: "Bánh xe",
    Teapot: "Ấm trà",
    TorusKnot: "Nút xoắn",
    Dodecahedron: "12 mặt",
    Capsule: "Capsule"
  };

  function spawnShape(type) {
    if (countUserSpawned() >= MAX_USER_SPAWN) return null;
    const factory = SPAWN_MAP[type] ?? createBox;
    const colors = [0x38bdf8, 0xa78bfa, 0xf59e0b, 0x34d399, 0xf87171];
    const n = countUserSpawned() + 1;
    const baseLabel = SPAWN_LABELS[type] ?? type;
    const config = {
      texture: getTexture("metal"),
      physicsMaterial: physicsMaterial.experimentMaterial,
      color: colors[n % colors.length],
      label: `${baseLabel} ${n}`
    };
    if (type === "Teapot") config.size = 0.75;
    const item = factory(config);
    decorateExperiment(item, config.label);
    item.spawnedByUser = true;
    addObject(item, [(Math.random() - 0.5) * 4, 8 + Math.random() * 3, (Math.random() - 0.5) * 4]);
    initialStates.push({ ref: item, ...snapshotBody(item) });
    return item;
  }

  function addLoadedModel(item) {
    if (countUserSpawned() >= MAX_USER_SPAWN) return null;
    decorateExperiment(item, item.label ?? "Model");
    item.spawnedByUser = true;
    addObject(item, [(Math.random() - 0.5) * 3, 9, (Math.random() - 0.5) * 3]);
    initialStates.push({ ref: item, ...snapshotBody(item) });
    return item;
  }

  function setRampAngle(rampObject, angleRad) {
    if (!rampObject) return;
    const q = new CANNON.Quaternion();
    q.setFromEuler(0, 0, -angleRad);
    rampObject.body.quaternion.copy(q);
    rampObject.mesh.quaternion.set(q.x, q.y, q.z, q.w);
  }

  function resetBodies() {
    for (const snap of initialStates) {
      const item = snap.ref;
      if (!objects.includes(item)) continue;
      const [x, y, z] = snap.position;
      item.body.position.set(x, y, z);
      item.body.quaternion.set(snap.quaternion[0], snap.quaternion[1], snap.quaternion[2], snap.quaternion[3]);
      item.body.velocity.set(snap.velocity.x, snap.velocity.y, snap.velocity.z);
      item.body.angularVelocity.set(snap.angularVelocity.x, snap.angularVelocity.y, snap.angularVelocity.z);
      item.mesh.position.set(x, y, z);
      item.mesh.quaternion.copy(item.body.quaternion);
    }
  }

  function getExperimentObjects() {
    return objects.filter((o) => o.role === "experiment");
  }

  return {
    objects,
    addObject,
    removeObject,
    clearAll,
    buildScene,
    spawnShape,
    addLoadedModel,
    syncMeshesFromBodies,
    setRampAngle,
    resetBodies,
    getExperimentObjects,
    countUserSpawned,
    MAX_USER_SPAWN
  };
}
