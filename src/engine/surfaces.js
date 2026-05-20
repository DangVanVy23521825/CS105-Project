import * as CANNON from "cannon-es";

/**
 * Quan ly vat lieu tiep xuc theo mat canh (mu tren surface, khong tren vat thi nghiem).
 */
export function createSurfaceManager(world, experimentMaterial) {
  const surfaces = [];
  let activeSurfaceId = null;

  function registerSurface(simObject, { friction = 0.4, label = "Mat" }) {
    const surfaceMaterial = new CANNON.Material(`surface_${surfaces.length}`);
    const contact = new CANNON.ContactMaterial(experimentMaterial, surfaceMaterial, {
      friction,
      restitution: 0.2
    });
    world.addContactMaterial(contact);

    simObject.body.material = surfaceMaterial;
    simObject.role = "surface";
    simObject.isStatic = true;
    simObject.label = label;
    simObject.surfaceFriction = friction;
    simObject.surfaceId = `surface_${surfaces.length}`;

    const entry = {
      id: simObject.surfaceId,
      object: simObject,
      material: surfaceMaterial,
      contact,
      friction
    };
    surfaces.push(entry);
    if (!activeSurfaceId) activeSurfaceId = entry.id;
    return entry;
  }

  function getActiveSurface() {
    return surfaces.find((s) => s.id === activeSurfaceId) ?? surfaces[0] ?? null;
  }

  function setActiveSurfaceFriction(mu) {
    const s = getActiveSurface();
    if (!s) return;
    s.friction = mu;
    s.contact.friction = mu;
    s.object.surfaceFriction = mu;
  }

  function getActiveFriction() {
    return getActiveSurface()?.friction ?? 0.4;
  }

  function setActiveSurfaceByObject(simObject) {
    if (simObject?.surfaceId) activeSurfaceId = simObject.surfaceId;
  }

  function pickActiveForScene(sceneName) {
    const ramp = surfaces.find((s) => s.object.label?.includes("nghieng") || s.object.label?.includes("doc"));
    const ground = surfaces.find((s) => s.object.label === "San");
    if (sceneName === "Inclined Plane" && ramp) activeSurfaceId = ramp.id;
    else if (ground) activeSurfaceId = ground.id;
  }

  function clear() {
    for (const s of surfaces) {
      world.removeContactMaterial(s.contact);
    }
    surfaces.length = 0;
    activeSurfaceId = null;
  }

  return {
    surfaces,
    registerSurface,
    getActiveSurface,
    setActiveSurfaceFriction,
    getActiveFriction,
    setActiveSurfaceByObject,
    pickActiveForScene,
    clear
  };
}
