import * as THREE from "three";
import * as CANNON from "cannon-es";
import { TeapotGeometry } from "three/addons/geometries/TeapotGeometry.js";

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
      shape = new CANNON.Box(
        new CANNON.Vec3(args.width / 2, args.height / 2, args.depth / 2)
      );
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
      shape = new CANNON.Cylinder(args.majorRadius, args.majorRadius, args.tube, 24);
      break;
    case "teapot":
      shape = new CANNON.Sphere(args.size * 0.56);
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

function buildObject({ kind, geometry, bodyArgs, mass, material, name }) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;

  const body = createBodyByKind(kind, bodyArgs, mass, material.userData.physicsMaterial);
  body.linearDamping = 0.06;
  body.angularDamping = 0.05;

  return {
    kind,
    mesh,
    body,
    baseBodyArgs: bodyArgs,
    mass,
    animation: {
      spinSpeed: 0,
      bobAmp: 0,
      bobFreq: 0
    }
  };
}

export function createGround({ width = 40, depth = 40, texture, physicsMaterial }) {
  const geometry = new THREE.BoxGeometry(width, 0.6, depth);
  const material = createPhongMaterial(texture, {
    color: 0x475569,
    shininess: 20,
    specular: 0x999999
  });
  material.userData.physicsMaterial = physicsMaterial;

  const item = buildObject({
    kind: "box",
    geometry,
    bodyArgs: { width, height: 0.6, depth },
    mass: 0,
    material,
    name: "Ground"
  });
  item.mesh.receiveShadow = true;
  return item;
}

export function createBox(options) {
  const args = {
    width: options.width ?? 1.8,
    height: options.height ?? 1.8,
    depth: options.depth ?? 1.8
  };
  const material = createPhongMaterial(options.texture, options);
  material.userData.physicsMaterial = options.physicsMaterial;
  return buildObject({
    kind: "box",
    geometry: new THREE.BoxGeometry(args.width, args.height, args.depth),
    bodyArgs: args,
    mass: options.mass ?? 2,
    material,
    name: "Box"
  });
}

export function createSphere(options) {
  const args = { radius: options.radius ?? 1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData.physicsMaterial = options.physicsMaterial;
  return buildObject({
    kind: "sphere",
    geometry: new THREE.SphereGeometry(args.radius, 32, 20),
    bodyArgs: args,
    mass: options.mass ?? 2,
    material,
    name: "Sphere"
  });
}

export function createCone(options) {
  const args = {
    radius: options.radius ?? 0.9,
    height: options.height ?? 2.1
  };
  const material = createPhongMaterial(options.texture, options);
  material.userData.physicsMaterial = options.physicsMaterial;
  return buildObject({
    kind: "cone",
    geometry: new THREE.ConeGeometry(args.radius, args.height, 28),
    bodyArgs: args,
    mass: options.mass ?? 1.8,
    material,
    name: "Cone"
  });
}

export function createCylinder(options) {
  const args = {
    radiusTop: options.radiusTop ?? 0.8,
    radiusBottom: options.radiusBottom ?? 0.8,
    height: options.height ?? 2.2
  };
  const material = createPhongMaterial(options.texture, options);
  material.userData.physicsMaterial = options.physicsMaterial;
  return buildObject({
    kind: "cylinder",
    geometry: new THREE.CylinderGeometry(
      args.radiusTop,
      args.radiusBottom,
      args.height,
      28
    ),
    bodyArgs: args,
    mass: options.mass ?? 2.5,
    material,
    name: "Cylinder"
  });
}

export function createWheel(options) {
  const args = {
    majorRadius: options.majorRadius ?? 1.1,
    tube: options.tube ?? 0.38
  };
  const material = createPhongMaterial(options.texture, options);
  material.userData.physicsMaterial = options.physicsMaterial;
  const item = buildObject({
    kind: "torus",
    geometry: new THREE.TorusGeometry(args.majorRadius, args.tube, 20, 40),
    bodyArgs: args,
    mass: options.mass ?? 2.2,
    material,
    name: "Wheel"
  });
  item.animation.spinSpeed = 2.1;
  return item;
}

export function createTeapot(options) {
  const args = { size: options.size ?? 1.1 };
  const material = createPhongMaterial(options.texture, options);
  material.userData.physicsMaterial = options.physicsMaterial;
  const item = buildObject({
    kind: "teapot",
    geometry: new TeapotGeometry(args.size, 10, true, true, true, false, true),
    bodyArgs: args,
    mass: options.mass ?? 3,
    material,
    name: "Teapot"
  });
  item.animation.bobAmp = 0.2;
  item.animation.bobFreq = 1.7;
  return item;
}

export function updateObjectScale(simObject, scaleValue) {
  simObject.mesh.scale.setScalar(scaleValue);

  const b = simObject.baseBodyArgs;
  simObject.body.shapes = [];

  const scale = scaleValue;
  let shape;
  switch (simObject.kind) {
    case "box":
      shape = new CANNON.Box(
        new CANNON.Vec3((b.width * scale) / 2, (b.height * scale) / 2, (b.depth * scale) / 2)
      );
      simObject.body.addShape(shape);
      break;
    case "sphere":
      simObject.body.addShape(new CANNON.Sphere(b.radius * scale));
      break;
    case "cone":
      simObject.body.addShape(
        new CANNON.Cylinder(b.radius * scale, 0.001, b.height * scale, 20)
      );
      break;
    case "cylinder":
      simObject.body.addShape(
        new CANNON.Cylinder(
          b.radiusTop * scale,
          b.radiusBottom * scale,
          b.height * scale,
          20
        )
      );
      break;
    case "torus": {
      shape = new CANNON.Cylinder(b.majorRadius * scale, b.majorRadius * scale, b.tube * scale, 24);
      const q = new CANNON.Quaternion();
      q.setFromEuler(Math.PI / 2, 0, 0);
      simObject.body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);
      break;
    }
    case "teapot":
      simObject.body.addShape(new CANNON.Sphere(b.size * scale * 0.56));
      break;
    case "model":
      simObject.body.addShape(new CANNON.Sphere(Math.max(0.4, scale)));
      break;
    default:
      simObject.body.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)));
      break;
  }
  simObject.body.updateMassProperties();
}
