import * as CANNON from "cannon-es";
import {
  createBox, createCone, createCylinder, createGround, createSphere,
  createTeapot, createWheel, createTorusKnot, createDodecahedron,
  createIcosahedron, createOctahedron, createCapsule, createLathe
} from "../components/geometries.js";

function disposeMesh(mesh) {
  mesh.traverse?.((child) => {
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
    else if (child.material) child.material.dispose();
  });
}

export function createSceneManager({ scene, world, getTexture, physicsMaterial }) {
  const objects = [];

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

  function removeObject(item) {
    const idx = objects.indexOf(item);
    if (idx >= 0) objects.splice(idx, 1);
    world.removeBody(item.body);
    scene.remove(item.mesh);
    disposeMesh(item.mesh);
  }

  function clearAll() {
    for (const item of [...objects]) removeObject(item);
  }

  // ─── Scene 1: Mặt phẳng nghiêng ───
  function initInclinedPlane() {
    const ground = createGround({ width: 42, depth: 42, texture: getTexture("grid"), physicsMaterial });
    addObject(ground, [0, -0.4, 0]);

    const ramp = createBox({ width: 14, height: 0.7, depth: 9, mass: 0, texture: getTexture("wood"), color: 0xb08968, physicsMaterial });
    const theta = Math.PI * 0.15;
    addObject(ramp, [0, 2.5, -1], [0, 0, -theta]);

    addObject(createBox({ width: 1.4, height: 1.4, depth: 1.4, mass: 2, texture: getTexture("metal"), color: 0x94a3b8, physicsMaterial }), [-3, 6, -1]);
    addObject(createSphere({ radius: 0.9, mass: 1.5, texture: getTexture("grid"), color: 0x93c5fd, physicsMaterial }), [2, 6.5, -1]);
    addObject(createCylinder({ radiusTop: 0.6, radiusBottom: 0.6, height: 1.6, mass: 1.8, texture: getTexture("marble"), color: 0xddd6fe, physicsMaterial }), [-0.5, 7, -1]);

    const wallBack = createBox({ width: 20, height: 3, depth: 0.5, mass: 0, texture: getTexture("brick"), color: 0x7c3f00, physicsMaterial });
    addObject(wallBack, [0, 1.5, -10]);

    return { name: "Inclined Plane", rampObject: ramp };
  }

  // ─── Scene 2: Rơi tự do ───
  function initFreeFall() {
    const ground = createGround({ width: 40, depth: 40, texture: getTexture("grid"), physicsMaterial });
    addObject(ground, [0, -0.4, 0]);

    const shapes = [createSphere, createBox, createCone, createDodecahedron, createTeapot, createCapsule];
    const textures = ["metal", "wood", "marble", "checker", "lava", "grid"];
    const colors = [0x38bdf8, 0xfbbf24, 0xa78bfa, 0xf87171, 0xf1f5f9, 0x34d399];

    for (let i = 0; i < 6; i++) {
      const mass = 1 + i * 1.5;
      const factory = shapes[i];
      const options = { mass, texture: getTexture(textures[i]), color: colors[i], physicsMaterial };
      if (factory === createTeapot) options.size = 0.85;
      const item = factory(options);
      addObject(item, [-8 + i * 3.2, 11 + i * 2, 0]);
    }

    return { name: "Free Fall" };
  }

  // ─── Scene 3: Lực ngang & ma sát ───
  function initHorizontalForce() {
    const ground = createGround({ width: 50, depth: 50, texture: getTexture("grid"), physicsMaterial });
    addObject(ground, [0, -0.4, 0]);

    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const tex = ["wood", "metal", "marble", "brick"][col];
      const box = createBox({ width: 1.6, height: 1.2, depth: 1.6, mass: 1.5 + i * 0.3, texture: getTexture(tex), color: 0xf8fafc, physicsMaterial });
      addObject(box, [-6 + col * 4, 1.5 + row * 3, -4 + row * 4]);
    }

    addObject(createCone({ mass: 1.6, texture: getTexture("lava"), color: 0xfdba74, physicsMaterial }), [5, 6, 4]);
    addObject(createTorusKnot({ mass: 2, texture: getTexture("metal"), color: 0x818cf8, physicsMaterial }), [-3, 8, 3]);
    addObject(createOctahedron({ mass: 1.5, texture: getTexture("checker"), color: 0xfbbf24, physicsMaterial }), [0, 10, 0]);

    return { name: "Horizontal Force" };
  }

  // ─── Scene 4: Va chạm đàn hồi ───
  function initCollisionPlayground() {
    const ground = createGround({ width: 48, depth: 48, texture: getTexture("grid"), physicsMaterial });
    addObject(ground, [0, -0.4, 0]);

    addObject(createBox({ width: 0.6, height: 5.5, depth: 24, mass: 0, texture: getTexture("wood"), color: 0x7c3f00, physicsMaterial }), [-12, 2.5, 0]);
    addObject(createBox({ width: 0.6, height: 5.5, depth: 24, mass: 0, texture: getTexture("wood"), color: 0x7c3f00, physicsMaterial }), [12, 2.5, 0]);
    addObject(createBox({ width: 24, height: 5.5, depth: 0.6, mass: 0, texture: getTexture("wood"), color: 0x7c3f00, physicsMaterial }), [0, 2.5, -12]);
    addObject(createBox({ width: 24, height: 5.5, depth: 0.6, mass: 0, texture: getTexture("wood"), color: 0x7c3f00, physicsMaterial }), [0, 2.5, 12]);

    const factories = [createSphere, createCylinder, createWheel, createTeapot, createBox, createDodecahedron, createIcosahedron, createTorusKnot];
    const texes = ["metal", "wood", "marble", "grid", "checker", "lava", "metal", "brick"];
    for (let i = 0; i < 12; i++) {
      const factory = factories[i % factories.length];
      const opts = { mass: 1.2 + Math.random() * 2, texture: getTexture(texes[i % texes.length]), physicsMaterial };
      if (factory === createTeapot) opts.size = 0.8;
      const item = factory(opts);
      const x = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 16;
      addObject(item, [x, 3 + i * 1.5, z]);
    }

    const a = createSphere({ radius: 1, mass: 3, texture: getTexture("metal"), color: 0x38bdf8, physicsMaterial });
    addObject(a, [-9, 3, 0]).body.velocity.set(12, 0, 0);
    const b = createSphere({ radius: 1, mass: 3, texture: getTexture("metal"), color: 0xf97316, physicsMaterial });
    addObject(b, [9, 3, 0]).body.velocity.set(-12, 0, 0);

    return { name: "Collision Playground" };
  }

  // ─── Scene 5: Hiệu ứng Domino ───
  function initDominoChain() {
    const ground = createGround({ width: 60, depth: 30, texture: getTexture("grid"), physicsMaterial });
    addObject(ground, [0, -0.4, 0]);

    const count = 20;
    const spacing = 1.6;
    const startX = -(count * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const angle = i < count / 2 ? 0 : Math.sin((i - count / 2) * 0.15) * 0.1;
      const z = i < count / 2 ? 0 : Math.sin((i - count / 2) * 0.3) * 3;
      const texName = ["wood", "marble", "metal", "brick", "checker"][i % 5];
      const colors = [0xf87171, 0xfbbf24, 0x34d399, 0x38bdf8, 0xa78bfa, 0xfb923c];

      const domino = createBox({
        width: 0.35,
        height: 2.2,
        depth: 1.2,
        mass: 1,
        texture: getTexture(texName),
        color: colors[i % colors.length],
        physicsMaterial,
        name: `Domino ${i + 1}`
      });
      addObject(domino, [startX + i * spacing, 1.5, z], [0, angle, 0]);
    }

    const striker = createSphere({ radius: 0.7, mass: 4, texture: getTexture("metal"), color: 0xef4444, physicsMaterial });
    addObject(striker, [startX - 2.5, 1.5, 0]).body.velocity.set(6, 0, 0);

    addObject(createTeapot({ size: 1.2, mass: 5, texture: getTexture("lava"), color: 0xff4500, physicsMaterial }), [startX + count * spacing + 3, 1.5, 0]);

    return { name: "Domino Chain" };
  }

  function buildScene(sceneName) {
    clearAll();
    switch (sceneName) {
      case "Inclined Plane":       return initInclinedPlane();
      case "Free Fall":            return initFreeFall();
      case "Horizontal Force":     return initHorizontalForce();
      case "Collision Playground": return initCollisionPlayground();
      case "Domino Chain":         return initDominoChain();
      default:                     return initCollisionPlayground();
    }
  }

  const SPAWN_MAP = {
    Box: createBox, Sphere: createSphere, Cone: createCone,
    Cylinder: createCylinder, Wheel: createWheel, Teapot: createTeapot,
    TorusKnot: createTorusKnot, Dodecahedron: createDodecahedron,
    Icosahedron: createIcosahedron, Octahedron: createOctahedron,
    Capsule: createCapsule, Lathe: createLathe
  };

  function spawnShape(type) {
    const factory = SPAWN_MAP[type] ?? createBox;
    const colors = [0x38bdf8, 0xa78bfa, 0xf59e0b, 0x34d399, 0xf87171, 0xfb923c];
    const config = {
      texture: getTexture("metal"),
      physicsMaterial,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    if (type === "Teapot") config.size = 0.9;
    const item = factory(config);
    addObject(item, [(Math.random() - 0.5) * 6, 10 + Math.random() * 5, (Math.random() - 0.5) * 6]);
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
    for (const item of objects) {
      if (item.body.mass > 0) {
        item.body.velocity.set(0, 0, 0);
        item.body.angularVelocity.set(0, 0, 0);
      }
    }
  }

  return { objects, addObject, removeObject, clearAll, buildScene, spawnShape, setRampAngle, resetBodies };
}
