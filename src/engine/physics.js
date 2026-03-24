import * as CANNON from "cannon-es";

export function createPhysicsEngine() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0)
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;

  const defaultMaterial = new CANNON.Material("default");
  const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
      friction: 0.4,
      restitution: 0.35
    }
  );

  world.defaultContactMaterial = defaultContactMaterial;
  world.addContactMaterial(defaultContactMaterial);

  function update() {
    // Dung fixed timestep 1/60 de mo phong on dinh va lap lai duoc.
    world.step(1 / 60);
  }

  function setGravity(x, y, z) {
    world.gravity.set(x, y, z);
  }

  function setMaterialProps({ friction, restitution }) {
    if (typeof friction === "number") {
      defaultContactMaterial.friction = friction;
    }
    if (typeof restitution === "number") {
      defaultContactMaterial.restitution = restitution;
    }
  }

  return {
    world,
    defaultMaterial,
    defaultContactMaterial,
    update,
    setGravity,
    setMaterialProps
  };
}
