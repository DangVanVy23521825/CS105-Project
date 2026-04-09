import * as CANNON from "cannon-es";

export function createPhysicsEngine() {
  // Khoi tao the gioi vat ly voi trong luc mac dinh 9.82 m/s^2
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 12;

  const defaultMaterial = new CANNON.Material("default");
  const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    { friction: 0.4, restitution: 0.35 }
  );

  world.defaultContactMaterial = defaultContactMaterial;
  world.addContactMaterial(defaultContactMaterial);

  // Danh sach callback cho su kien va cham
  const collisionCallbacks = [];

  world.addEventListener("postStep", () => {
    for (const contact of world.contacts) {
      for (const cb of collisionCallbacks) {
        cb(contact);
      }
    }
  });

  function onCollision(callback) {
    collisionCallbacks.push(callback);
  }

  // Buoc mo phong co dinh 1/60 de dam bao on dinh
  function update() {
    world.step(1 / 60);
  }

  function setGravity(x, y, z) {
    world.gravity.set(x, y, z);
  }

  function setMaterialProps({ friction, restitution }) {
    if (typeof friction === "number") defaultContactMaterial.friction = friction;
    if (typeof restitution === "number") defaultContactMaterial.restitution = restitution;
  }

  return {
    world,
    defaultMaterial,
    defaultContactMaterial,
    update,
    setGravity,
    setMaterialProps,
    onCollision
  };
}
