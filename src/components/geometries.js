import * as THREE from "three";
import * as CANNON from "cannon-es";
import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js";
import { createDefaultForceFrame, createDefaultForceAxes } from "../physics/forces.js";

/** MeshPhongMaterial — mo hinh chieu sang Phong (ambient + diffuse + specular). */
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
  switch (kind) {
    case "box":
      shape = new CANNON.Box(new CANNON.Vec3(args.width / 2, args.height / 2, args.depth / 2));
      break;
    case "sphere":
      shape = new CANNON.Sphere(args.radius);
      break;
    case "cone":
      shape = new CANNON.Cylinder(args.radius, 0.001, args.height, 16);
      break;
    case "cylinder":
      shape = new CANNON.Cylinder(args.radiusTop, args.radiusBottom, args.height, 16);
      break;
    case "torus":
    case "torusknot":
      shape = new CANNON.Sphere(args.outerRadius ?? 1);
      break;
    case "teapot":
      shape = new CANNON.Sphere(args.size * 0.56);
      break;
    case "dodecahedron":
    case "icosahedron":
    case "octahedron":
      shape = new CANNON.Sphere(args.radius);
      break;
    case "capsule":
      shape = new CANNON.Cylinder(args.radius, args.radius, args.length + args.radius * 2, 12);
      break;
    case "model":
      shape = new CANNON.Sphere(args.radius ?? 1);
      break;
    default:
      shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  }
  const body = new CANNON.Body({ mass, material });
  if (kind === "torus") {
    const q = new CANNON.Quaternion();
    q.setFromEuler(Math.PI / 2, 0, 0);
    body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);
  } else {
    body.addShape(shape);
  }
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

  return {
    kind,
    mesh,
    body,
    baseBodyArgs: bodyArgs,
    mass,
    isStatic,
    role,
    label: label ?? name ?? kind,
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
  const args = { width: options.width ?? 1.4, height: options.height ?? 1.4, depth: options.depth ?? 1.4 };
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
    label: options.label ?? options.name ?? "Hộp"
  });
}

export function createSphere(options) {
  const args = { radius: options.radius ?? 0.9 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const mass = options.mass ?? 2;
  return buildObject({
    kind: "sphere",
    geometry: new THREE.SphereGeometry(args.radius, 32, 24),
    bodyArgs: args,
    mass,
    material,
    name: options.name ?? "Cau",
    role: options.role ?? (mass === 0 ? "surface" : "experiment"),
    label: options.label ?? options.name ?? "Cầu"
  });
}

export function createCone(options) {
  const args = { radius: options.radius ?? 0.75, height: options.height ?? 1.6 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const mass = options.mass ?? 1.8;
  return buildObject({
    kind: "cone",
    geometry: new THREE.ConeGeometry(args.radius, args.height, 24),
    bodyArgs: args,
    mass,
    material,
    name: "Non",
    label: options.label ?? "Nón"
  });
}

export function createCylinder(options) {
  const args = {
    radiusTop: options.radiusTop ?? 0.7,
    radiusBottom: options.radiusBottom ?? 0.7,
    height: options.height ?? 1.6
  };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const mass = options.mass ?? 2.2;
  return buildObject({
    kind: "cylinder",
    geometry: new THREE.CylinderGeometry(args.radiusTop, args.radiusBottom, args.height, 24),
    bodyArgs: args,
    mass,
    material,
    name: "Tru",
    label: options.label ?? "Trụ"
  });
}

export function createWheel(options) {
  const args = { majorRadius: options.majorRadius ?? 0.9, tube: options.tube ?? 0.28, outerRadius: 1.18 };
  args.outerRadius = args.majorRadius + args.tube;
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const mass = options.mass ?? 2;
  const item = buildObject({
    kind: "torus",
    geometry: new THREE.TorusGeometry(args.majorRadius, args.tube, 16, 32),
    bodyArgs: args,
    mass,
    material,
    name: "Wheel",
    label: options.label ?? "Bánh xe"
  });
  item.animation.spinSpeed = 2;
  return item;
}

export function createTeapot(options) {
  const args = { size: options.size ?? 0.85 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const mass = options.mass ?? 2.5;
  return buildObject({
    kind: "teapot",
    geometry: new TeapotGeometry(args.size, 8, true, true, true, false, true),
    bodyArgs: args,
    mass,
    material,
    name: "Teapot",
    label: options.label ?? "Ấm trà"
  });
}

/** Hinh bo sung (yeu cau "tu tim hieu them") */
export function createTorusKnot(options) {
  const args = { radius: 0.65, tube: 0.22, outerRadius: 0.87 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({
    kind: "torusknot",
    geometry: new THREE.TorusKnotGeometry(args.radius, args.tube, 64, 12),
    bodyArgs: args,
    mass: options.mass ?? 2,
    material,
    name: "TorusKnot",
    label: options.label ?? "Nút xoắn"
  });
}

export function createDodecahedron(options) {
  const args = { radius: options.radius ?? 0.85 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({
    kind: "dodecahedron",
    geometry: new THREE.DodecahedronGeometry(args.radius),
    bodyArgs: args,
    mass: options.mass ?? 2,
    material,
    name: "Dodecahedron",
    label: options.label ?? "12 mặt"
  });
}

export function createCapsule(options) {
  const args = { radius: options.radius ?? 0.45, length: options.length ?? 1.1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({
    kind: "capsule",
    geometry: new THREE.CapsuleGeometry(args.radius, args.length, 8, 16),
    bodyArgs: args,
    mass: options.mass ?? 1.8,
    material,
    name: "Capsule",
    label: options.label ?? "Capsule"
  });
}

export function updateObjectScale(simObject, scaleValue) {
  simObject.mesh.scale.setScalar(scaleValue);
  const b = simObject.baseBodyArgs;
  simObject.body.shapes = [];
  simObject.body.shapeOffsets = [];
  simObject.body.shapeOrientations = [];
  const s = scaleValue;

  switch (simObject.kind) {
    case "box":
      simObject.body.addShape(
        new CANNON.Box(new CANNON.Vec3((b.width * s) / 2, (b.height * s) / 2, (b.depth * s) / 2))
      );
      break;
    case "sphere":
    case "dodecahedron":
    case "icosahedron":
    case "octahedron":
      simObject.body.addShape(new CANNON.Sphere(b.radius * s));
      break;
    case "cone":
      simObject.body.addShape(new CANNON.Cylinder(b.radius * s, 0.001, b.height * s, 16));
      break;
    case "cylinder":
      simObject.body.addShape(new CANNON.Cylinder(b.radiusTop * s, b.radiusBottom * s, b.height * s, 16));
      break;
    case "torus":
    case "torusknot":
      simObject.body.addShape(new CANNON.Sphere((b.outerRadius ?? 1) * s));
      break;
    case "teapot":
      simObject.body.addShape(new CANNON.Sphere(b.size * s * 0.56));
      break;
    case "capsule":
      simObject.body.addShape(new CANNON.Cylinder(b.radius * s, b.radius * s, (b.length + b.radius * 2) * s, 12));
      break;
    case "model":
      simObject.body.addShape(new CANNON.Sphere(Math.max(0.4, (b.radius ?? 1) * s)));
      break;
    default:
      simObject.body.addShape(new CANNON.Box(new CANNON.Vec3(0.5 * s, 0.5 * s, 0.5 * s)));
      break;
  }
  simObject.body.updateMassProperties();
}
