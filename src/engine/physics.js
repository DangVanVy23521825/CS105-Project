import * as CANNON from "cannon-es";

export function createPhysicsEngine() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.solver.iterations = 12;

  const experimentMaterial = new CANNON.Material("experiment");
  const defaultMaterial = new CANNON.Material("default");

  const experimentSelfContact = new CANNON.ContactMaterial(experimentMaterial, experimentMaterial, {
    friction: 0.05,
    restitution: 0.35
  });
  world.addContactMaterial(experimentSelfContact);

  const defaultContactMaterial = experimentSelfContact;

  const collisionCallbacks = [];
  const beginContactCallbacks = [];
  const endContactCallbacks = [];

  world.addEventListener("postStep", () => {
    for (const contact of world.contacts) {
      for (const cb of collisionCallbacks) {
        cb(contact);
      }
    }
  });

  world.addEventListener("beginContact", (event) => {
    for (const cb of beginContactCallbacks) cb(event);
  });

  world.addEventListener("endContact", (event) => {
    for (const cb of endContactCallbacks) cb(event);
  });

  function onCollision(callback) {
    collisionCallbacks.push(callback);
  }

  function onBeginContact(callback) {
    beginContactCallbacks.push(callback);
  }

  function onEndContact(callback) {
    endContactCallbacks.push(callback);
  }

  function update(stepOnce = false) {
    if (stepOnce) {
      world.step(1 / 60);
    } else {
      world.step(1 / 60);
    }
  }

  function setGravity(x, y, z) {
    world.gravity.set(x, y, z);
  }

  function setRestitution(e) {
    experimentSelfContact.restitution = e;
  }

  function setMaterialProps({ friction, restitution }) {
    if (typeof restitution === "number") setRestitution(restitution);
  }

  return {
    world,
    defaultMaterial,
    experimentMaterial,
    defaultContactMaterial,
    experimentSelfContact,
    update,
    setGravity,
    setRestitution,
    setMaterialProps,
    onCollision,
    onBeginContact,
    onEndContact
  };
}
