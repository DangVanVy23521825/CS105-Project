import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { createDefaultForceFrame, createDefaultForceAxes } from "../physics/forces.js";

function createMaterial(texture, physicsMaterial) {
  const material = new THREE.MeshPhongMaterial({
    color: 0xe2e8f0,
    shininess: 60,
    specular: new THREE.Color(0xffffff),
    map: texture ?? null
  });
  material.userData = { physicsMaterial };
  return material;
}

function buildBodyFromBoundingBox(object3D, mass, physicsMaterial) {
  const bbox = new THREE.Box3().setFromObject(object3D);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const hx = Math.max(0.3, size.x / 2);
  const hy = Math.max(0.3, size.y / 2);
  const hz = Math.max(0.3, size.z / 2);
  const radius = Math.max(hx, hy, hz);

  const body = new CANNON.Body({ mass, material: physicsMaterial });
  body.addShape(new CANNON.Sphere(radius));
  return { body, radius };
}

export async function loadModelFromFile({ file, texture, physicsMaterial, mass = 3 }) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const url = URL.createObjectURL(file);

  try {
    let root;
    if (ext === "glb" || ext === "gltf") {
      root = (await new GLTFLoader().loadAsync(url)).scene;
    } else if (ext === "obj") {
      root = await new OBJLoader().loadAsync(url);
    } else {
      throw new Error("Dinh dang khong ho tro (.glb, .gltf, .obj)");
    }

    const material = createMaterial(texture, physicsMaterial);
    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = material.clone();
      }
    });

    const wrapper = new THREE.Group();
    wrapper.name = `Model-${file.name}`;
    wrapper.add(root);

    const { body, radius } = buildBodyFromBoundingBox(wrapper, mass, physicsMaterial);
    body.linearDamping = 0.08;
    body.angularDamping = 0.08;

    return {
      kind: "model",
      mesh: wrapper,
      body,
      baseBodyArgs: { radius },
      mass,
      isStatic: false,
      role: "experiment",
      label: `Model: ${file.name}`,
      spawnedByUser: true,
      forceFrame: createDefaultForceFrame(),
      forceAxes: createDefaultForceAxes(),
      surfaceFriction: 0.4,
      animation: { spinSpeed: 0, bobAmp: 0, bobFreq: 0 }
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
