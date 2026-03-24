import * as CANNON from "cannon-es";
import {
  createBox,
  createCone,
  createCylinder,
  createGround,
  createSphere,
  createTeapot,
  createWheel
} from "../components/geometries.js";

function disposeMesh(mesh) {
  mesh.traverse?.((child) => {
    if (child.geometry) child.geometry.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((m) => m.dispose());
    } else if (child.material) {
      child.material.dispose();
    }
  });
}

export function createSceneManager({
  scene,
  world,
  getTexture,
  physicsMaterial
}) {
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
    if (idx >= 0) {
      objects.splice(idx, 1);
    }
    world.removeBody(item.body);
    scene.remove(item.mesh);
    disposeMesh(item.mesh);
  }

  function clearAll() {
    for (const item of [...objects]) {
      removeObject(item);
    }
  }

  function initInclinedPlane() {
    const ground = createGround({
      width: 42,
      depth: 42,
      texture: getTexture("grid"),
      physicsMaterial
    });
    addObject(ground, [0, -0.4, 0]);

    const ramp = createBox({
      width: 12,
      height: 0.7,
      depth: 8,
      mass: 0,
      texture: getTexture("wood"),
      color: 0xb08968,
      physicsMaterial
    });
    const theta = Math.PI * 0.15;
    addObject(ramp, [0, 2.2, -2], [0, 0, -theta]);

    const slider = createBox({
      width: 1.4,
      height: 1.4,
      depth: 1.4,
      mass: 2,
      texture: getTexture("metal"),
      color: 0x94a3b8,
      physicsMaterial
    });
    addObject(slider, [-2.4, 5, -2.1], [0.1, 0.2, 0]);

    const ball = createSphere({
      radius: 0.9,
      mass: 1.5,
      texture: getTexture("grid"),
      color: 0x93c5fd,
      physicsMaterial
    });
    addObject(ball, [2.3, 5.4, -2.1]);

    return {
      name: "Inclined Plane",
      update: () => {},
      rampObject: ramp
    };
  }

  function initFreeFall() {
    const ground = createGround({
      width: 36,
      depth: 36,
      texture: getTexture("grid"),
      physicsMaterial
    });
    addObject(ground, [0, -0.4, 0]);

    for (let i = 0; i < 4; i += 1) {
      const mass = 1 + i * 2;
      const sphere = createSphere({
        radius: 0.8 + i * 0.05,
        mass,
        texture: getTexture(i % 2 ? "wood" : "metal"),
        color: 0xffffff,
        physicsMaterial
      });
      addObject(sphere, [-6 + i * 4, 10 + i * 1.8, 0]);
    }

    const teapot = createTeapot({
      size: 0.85,
      mass: 4.2,
      texture: getTexture("metal"),
      color: 0xf1f5f9,
      shininess: 90,
      physicsMaterial
    });
    addObject(teapot, [0, 13, -4.5], [0, Math.PI * 0.3, 0]);

    return {
      name: "Free Fall",
      update: () => {}
    };
  }

  function initHorizontalForce() {
    const ground = createGround({
      width: 45,
      depth: 45,
      texture: getTexture("grid"),
      physicsMaterial
    });
    addObject(ground, [0, -0.4, 0]);

    for (let i = 0; i < 6; i += 1) {
      const box = createBox({
        width: 1.8,
        height: 1.4,
        depth: 1.8,
        mass: 1.4 + i * 0.2,
        texture: getTexture(i % 2 ? "wood" : "metal"),
        color: 0xf8fafc,
        physicsMaterial
      });
      addObject(box, [-8 + i * 3.2, 2.5, -2 + (i % 2) * 2]);
    }

    const cone = createCone({
      radius: 1,
      height: 2.2,
      mass: 1.6,
      texture: getTexture("wood"),
      color: 0xfdba74,
      physicsMaterial
    });
    addObject(cone, [4, 5.5, 4]);

    return {
      name: "Horizontal Force",
      update: () => {}
    };
  }

  function initCollisionPlayground() {
    const ground = createGround({
      width: 48,
      depth: 48,
      texture: getTexture("grid"),
      physicsMaterial
    });
    addObject(ground, [0, -0.4, 0]);

    const wallLeft = createBox({
      width: 0.6,
      height: 5.5,
      depth: 20,
      mass: 0,
      texture: getTexture("wood"),
      color: 0x7c3f00,
      physicsMaterial
    });
    addObject(wallLeft, [-10, 2.5, 0]);

    const wallRight = createBox({
      width: 0.6,
      height: 5.5,
      depth: 20,
      mass: 0,
      texture: getTexture("wood"),
      color: 0x7c3f00,
      physicsMaterial
    });
    addObject(wallRight, [10, 2.5, 0]);

    for (let i = 0; i < 10; i += 1) {
      const type = i % 5;
      const spawnX = -6 + (i % 5) * 3;
      const spawnY = 2 + Math.floor(i / 5) * 2.8;
      const spawnZ = -2 + (i % 2) * 4;

      let item;
      if (type === 0) {
        item = createSphere({ mass: 1.3, texture: getTexture("metal"), physicsMaterial });
      } else if (type === 1) {
        item = createCylinder({
          mass: 2.5,
          radiusTop: 0.7,
          radiusBottom: 0.7,
          height: 2,
          texture: getTexture("wood"),
          physicsMaterial
        });
      } else if (type === 2) {
        item = createWheel({ mass: 2, texture: getTexture("metal"), physicsMaterial });
      } else if (type === 3) {
        item = createTeapot({ mass: 3, size: 0.95, texture: getTexture("grid"), physicsMaterial });
      } else {
        item = createBox({ mass: 2, texture: getTexture("wood"), physicsMaterial });
      }
      addObject(item, [spawnX, spawnY + 4, spawnZ]);
    }

    // Ban dau tao 2 vat dang lao vao nhau de trinh dien va cham.
    const strikerA = createSphere({
      radius: 0.9,
      mass: 2,
      texture: getTexture("metal"),
      color: 0x38bdf8,
      physicsMaterial
    });
    addObject(strikerA, [-8, 3, 0]).body.velocity.set(11, 0, 0);

    const strikerB = createSphere({
      radius: 0.9,
      mass: 2,
      texture: getTexture("metal"),
      color: 0xf97316,
      physicsMaterial
    });
    addObject(strikerB, [8, 3, 0]).body.velocity.set(-11, 0, 0);

    return {
      name: "Collision Playground",
      update: () => {}
    };
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
      default:
        return initCollisionPlayground();
    }
  }

  function spawnShape(type) {
    const config = {
      texture: getTexture("metal"),
      physicsMaterial
    };
    let item;
    switch (type) {
      case "Box":
        item = createBox(config);
        break;
      case "Sphere":
        item = createSphere(config);
        break;
      case "Cone":
        item = createCone(config);
        break;
      case "Cylinder":
        item = createCylinder(config);
        break;
      case "Wheel":
        item = createWheel(config);
        break;
      case "Teapot":
      default:
        item = createTeapot(config);
        break;
    }

    addObject(item, [(Math.random() - 0.5) * 6, 10 + Math.random() * 4, (Math.random() - 0.5) * 6]);
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

  return {
    objects,
    addObject,
    removeObject,
    clearAll,
    buildScene,
    spawnShape,
    setRampAngle,
    resetBodies
  };
}
