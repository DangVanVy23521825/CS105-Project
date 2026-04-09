import * as THREE from "three";
import * as CANNON from "cannon-es";
import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js";

function createPhongMaterial(texture, options = {}) {
  // MeshPhongMaterial: mo hinh chieu sang Phong (ambient + diffuse + specular)
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
      shape = new CANNON.Cylinder(args.radius, 0.001, args.height, 20);
      break;
    case "cylinder":
      shape = new CANNON.Cylinder(args.radiusTop, args.radiusBottom, args.height, 20);
      break;
    case "torus":
    case "torusknot":
      shape = new CANNON.Sphere(args.outerRadius ?? args.majorRadius ?? 1);
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
      shape = new CANNON.Cylinder(args.radius, args.radius, args.length + args.radius * 2, 16);
      break;
    case "lathe":
      shape = new CANNON.Cylinder(args.radius, args.radius, args.height, 16);
      break;
    default:
      shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  }

  const body = new CANNON.Body({ mass, material });
  body.addShape(shape);
  return body;
}

function buildObject({ kind, geometry, bodyArgs, mass, material, name }) {
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
    animation: { spinSpeed: 0, bobAmp: 0, bobFreq: 0, orbitRadius: 0, orbitSpeed: 0 }
  };
}

// ─── Factories ───

export function createGround({ width = 40, depth = 40, texture, physicsMaterial }) {
  const geometry = new THREE.BoxGeometry(width, 0.6, depth);
  const material = createPhongMaterial(texture, { color: 0x3b4252, shininess: 25, specular: 0x777777 });
  material.userData = { physicsMaterial };
  const item = buildObject({ kind: "box", geometry, bodyArgs: { width, height: 0.6, depth }, mass: 0, material, name: "Ground" });
  item.mesh.receiveShadow = true;
  return item;
}

export function createBox(options) {
  const args = { width: options.width ?? 1.8, height: options.height ?? 1.8, depth: options.depth ?? 1.8 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "box", geometry: new THREE.BoxGeometry(args.width, args.height, args.depth), bodyArgs: args, mass: options.mass ?? 2, material, name: options.name ?? "Box" });
}

export function createSphere(options) {
  const args = { radius: options.radius ?? 1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "sphere", geometry: new THREE.SphereGeometry(args.radius, 36, 24), bodyArgs: args, mass: options.mass ?? 2, material, name: "Sphere" });
}

export function createCone(options) {
  const args = { radius: options.radius ?? 0.9, height: options.height ?? 2.1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "cone", geometry: new THREE.ConeGeometry(args.radius, args.height, 28), bodyArgs: args, mass: options.mass ?? 1.8, material, name: "Cone" });
}

export function createCylinder(options) {
  const args = { radiusTop: options.radiusTop ?? 0.8, radiusBottom: options.radiusBottom ?? 0.8, height: options.height ?? 2.2 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "cylinder", geometry: new THREE.CylinderGeometry(args.radiusTop, args.radiusBottom, args.height, 28), bodyArgs: args, mass: options.mass ?? 2.5, material, name: "Cylinder" });
}

export function createWheel(options) {
  const args = { majorRadius: options.majorRadius ?? 1.1, tube: options.tube ?? 0.38 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const item = buildObject({ kind: "torus", geometry: new THREE.TorusGeometry(args.majorRadius, args.tube, 20, 40), bodyArgs: { ...args, outerRadius: args.majorRadius + args.tube }, mass: options.mass ?? 2.2, material, name: "Wheel" });
  item.animation.spinSpeed = 2.1;
  return item;
}

export function createTeapot(options) {
  const args = { size: options.size ?? 1.1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const item = buildObject({ kind: "teapot", geometry: new TeapotGeometry(args.size, 10, true, true, true, false, true), bodyArgs: args, mass: options.mass ?? 3, material, name: "Teapot" });
  item.animation.bobAmp = 0.2;
  item.animation.bobFreq = 1.7;
  return item;
}

export function createTorusKnot(options) {
  const args = { radius: options.radius ?? 0.8, tube: options.tube ?? 0.28 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  const item = buildObject({ kind: "torusknot", geometry: new THREE.TorusKnotGeometry(args.radius, args.tube, 80, 16), bodyArgs: { outerRadius: args.radius + args.tube }, mass: options.mass ?? 2.5, material, name: "TorusKnot" });
  item.animation.spinSpeed = 1.2;
  return item;
}

export function createDodecahedron(options) {
  const args = { radius: options.radius ?? 1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "dodecahedron", geometry: new THREE.DodecahedronGeometry(args.radius), bodyArgs: args, mass: options.mass ?? 2.2, material, name: "Dodecahedron" });
}

export function createIcosahedron(options) {
  const args = { radius: options.radius ?? 1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "icosahedron", geometry: new THREE.IcosahedronGeometry(args.radius), bodyArgs: args, mass: options.mass ?? 2, material, name: "Icosahedron" });
}

export function createOctahedron(options) {
  const args = { radius: options.radius ?? 1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "octahedron", geometry: new THREE.OctahedronGeometry(args.radius), bodyArgs: args, mass: options.mass ?? 1.8, material, name: "Octahedron" });
}

export function createCapsule(options) {
  const args = { radius: options.radius ?? 0.5, length: options.length ?? 1.4 };
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "capsule", geometry: new THREE.CapsuleGeometry(args.radius, args.length, 16, 24), bodyArgs: args, mass: options.mass ?? 2, material, name: "Capsule" });
}

export function createLathe(options) {
  const args = { radius: options.radius ?? 0.7, height: options.height ?? 2.2 };
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const r = args.radius * (0.5 + 0.5 * Math.sin(t * Math.PI));
    pts.push(new THREE.Vector2(r, t * args.height));
  }
  const material = createPhongMaterial(options.texture, options);
  material.userData = { physicsMaterial: options.physicsMaterial };
  return buildObject({ kind: "lathe", geometry: new THREE.LatheGeometry(pts, 28), bodyArgs: args, mass: options.mass ?? 2, material, name: "Lathe" });
}

// ─── Scale: cap nhat dong thoi mesh.scale va body shape ───

export function updateObjectScale(simObject, scaleValue) {
  simObject.mesh.scale.setScalar(scaleValue);
  const b = simObject.baseBodyArgs;
  simObject.body.shapes = [];
  simObject.body.shapeOffsets = [];
  simObject.body.shapeOrientations = [];

  const s = scaleValue;
  switch (simObject.kind) {
    case "box":
      simObject.body.addShape(new CANNON.Box(new CANNON.Vec3((b.width * s) / 2, (b.height * s) / 2, (b.depth * s) / 2)));
      break;
    case "sphere":
    case "dodecahedron":
    case "icosahedron":
    case "octahedron":
      simObject.body.addShape(new CANNON.Sphere(b.radius * s));
      break;
    case "cone":
      simObject.body.addShape(new CANNON.Cylinder(b.radius * s, 0.001, b.height * s, 20));
      break;
    case "cylinder":
      simObject.body.addShape(new CANNON.Cylinder(b.radiusTop * s, b.radiusBottom * s, b.height * s, 20));
      break;
    case "torus":
    case "torusknot":
      simObject.body.addShape(new CANNON.Sphere((b.outerRadius ?? 1) * s));
      break;
    case "teapot":
      simObject.body.addShape(new CANNON.Sphere(b.size * s * 0.56));
      break;
    case "capsule":
      simObject.body.addShape(new CANNON.Cylinder(b.radius * s, b.radius * s, (b.length + b.radius * 2) * s, 16));
      break;
    case "lathe":
      simObject.body.addShape(new CANNON.Cylinder(b.radius * s, b.radius * s, b.height * s, 16));
      break;
    case "model":
      simObject.body.addShape(new CANNON.Sphere(Math.max(0.4, s)));
      break;
    default:
      simObject.body.addShape(new CANNON.Box(new CANNON.Vec3(0.5 * s, 0.5 * s, 0.5 * s)));
      break;
  }
  simObject.body.updateMassProperties();
}
