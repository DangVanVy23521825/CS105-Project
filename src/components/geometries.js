import * as THREE from "three";
import * as CANNON from "cannon-es";
import { createDefaultForceFrame, createDefaultForceAxes } from "../physics/forces.js";

function createPhongMaterial(texture, options = {}) {
  return new THREE.MeshPhongMaterial({
    color: options.color ?? 0x9ca3af,
    shininess: options.shininess ?? 50,
    specular: new THREE.Color(options.specular ?? 0xffffff),
    map: texture ?? null
  });
}

function createBodyByKind(kind, args, mass, material) {
  let shape;
  if (kind === "box") {
    shape = new CANNON.Box(new CANNON.Vec3(args.width / 2, args.height / 2, args.depth / 2));
  } else if (kind === "sphere") {
    shape = new CANNON.Sphere(args.radius);
  } else {
    shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  }
  const body = new CANNON.Body({ mass, material });
  body.addShape(shape);
  return body;
}

function buildObject({ kind, geometry, bodyArgs, mass, material, name, role = "experiment", label }) {
  const isStatic = mass === 0;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;

  const body = createBodyByKind(kind, bodyArgs, mass, material.userData?.physicsMaterial);
  body.linearDamping = 0.06;
  body.angularDamping = 0.05;

  const displayLabel = label ?? name ?? kind;

  return {
    kind,
    mesh,
    body,
    baseBodyArgs: bodyArgs,
    mass,
    isStatic,
    role,
    label: displayLabel,
    spawnedByUser: false,
    forceFrame: createDefaultForceFrame(),
    forceAxes: createDefaultForceAxes(),
    surfaceFriction: 0.4,
    animation: { spinSpeed: 0, bobAmp: 0, bobFreq: 0 }
  };
}

export function createGround({ width = 40, depth = 40, texture, physicsMaterial, label = "San" }) {
  const geometry = new THREE.BoxGeometry(width, 0.6, depth);
  const material = createPhongMaterial(texture, { color: 0x3b4252, shininess: 25, specular: 0x777777 });
  material.userData = { physicsMaterial };
  const item = buildObject({
    kind: "box",
    geometry,
    bodyArgs: { width, height: 0.6, depth },
    mass: 0,
    material,
    name: "Ground",
    role: "surface",
    label
  });
  item.mesh.receiveShadow = true;
  return item;
}

export function createBox(options) {
  const args = { width: options.width ?? 1.8, height: options.height ?? 1.8, depth: options.depth ?? 1.8 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const mass = options.mass ?? 2;
  return buildObject({
    kind: "box",
    geometry: new THREE.BoxGeometry(args.width, args.height, args.depth),
    bodyArgs: args,
    mass,
    material,
    name: options.name ?? "Hop",
    role: options.role ?? (mass === 0 ? "surface" : "experiment"),
    label: options.label ?? options.name ?? "Hop"
  });
}

export function createSphere(options) {
  const args = { radius: options.radius ?? 1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const mass = options.mass ?? 2;
  return buildObject({
    kind: "sphere",
    geometry: new THREE.SphereGeometry(args.radius, 36, 24),
    bodyArgs: args,
    mass,
    material,
    name: options.name ?? "Cau",
    role: options.role ?? (mass === 0 ? "surface" : "experiment"),
    label: options.label ?? options.name ?? "Cau"
  });
}

export function updateObjectScale(simObject, scaleValue) {
  simObject.mesh.scale.setScalar(scaleValue);
  const b = simObject.baseBodyArgs;
  simObject.body.shapes = [];
  simObject.body.shapeOffsets = [];
  simObject.body.shapeOrientations = [];

  const s = scaleValue;
  if (simObject.kind === "box") {
    simObject.body.addShape(
      new CANNON.Box(new CANNON.Vec3((b.width * s) / 2, (b.height * s) / 2, (b.depth * s) / 2))
    );
  } else if (simObject.kind === "sphere") {
    simObject.body.addShape(new CANNON.Sphere(b.radius * s));
  }
  simObject.body.updateMassProperties();
}
