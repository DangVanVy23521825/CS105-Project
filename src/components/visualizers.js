import * as THREE from "three";
import {
  computeWeight,
  computeWorldForces,
  axesFromQuaternion,
  estimateContactForces,
  computeFnet,
  vecLength
} from "../physics/forces.js";
import { createForceLabelSet, placeLabelAtVectorTip, disposeLabels } from "./forceLabels.js";

function makeArrow(color) {
  return new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0, color, 0.35, 0.2);
}

export function createForceVisualizers(scene) {
  const arrows = {
    P: makeArrow(0x60a5fa),
    N: makeArrow(0x34d399),
    f: makeArrow(0xfbbf24),
    F1: makeArrow(0xf97316),
    F2: makeArrow(0xfb923c),
    F3: makeArrow(0xa78bfa),
    Fnet: makeArrow(0xef4444)
  };

  for (const a of Object.values(arrows)) {
    a.visible = false;
    scene.add(a);
  }

  const forceLabels = createForceLabelSet(["F1", "F2", "F3"]);
  for (const lbl of Object.values(forceLabels)) {
    lbl.visible = false;
    scene.add(lbl);
  }

  const scale = 0.02;
  const axisHintDist = 1.35;

  function setArrow(arrow, origin, vec) {
    const len = vecLength(vec);
    if (len < 0.01) {
      arrow.visible = false;
      return;
    }
    arrow.visible = true;
    arrow.position.copy(origin);
    const dir = new THREE.Vector3(vec.x, vec.y, vec.z).normalize();
    arrow.setDirection(dir);
    arrow.setLength(Math.min(len * scale, 6), 0.35, 0.18);
  }

  function updateForObject(simObject, gravityVec, surfaceFriction = 0.4) {
    if (!simObject || simObject.isStatic || simObject.body.mass <= 0) {
      for (const a of Object.values(arrows)) a.visible = false;
      for (const lbl of Object.values(forceLabels)) lbl.visible = false;
      return { rows: [], Fnet: { x: 0, y: 0, z: 0 } };
    }

    const origin = new THREE.Vector3(
      simObject.mesh.position.x,
      simObject.mesh.position.y + 0.5,
      simObject.mesh.position.z
    );

    const P = computeWeight(simObject.body.mass, gravityVec);
    const { N, f } = estimateContactForces(simObject, gravityVec, surfaceFriction);
    const Fnet = computeFnet(simObject, gravityVec, surfaceFriction);

    setArrow(arrows.P, origin, P);
    setArrow(arrows.N, origin, N);
    setArrow(arrows.f, origin, f);

    const slots = ["F1", "F2", "F3"];
    const basis = axesFromQuaternion(simObject.forceFrame);
    const basisAxes = [basis.u, basis.v, basis.w];
    const worldForces = computeWorldForces(simObject.forceFrame, simObject.forceAxes);
    worldForces.forEach((wf, i) => {
      const key = slots[i];
      const lbl = forceLabels[key];
      const mag = Math.abs(wf.magnitude ?? 0);
      if (wf.enabled && mag > 0.01) {
        setArrow(arrows[key], origin, wf.vector);
        const displayLen = Math.min(mag * scale, 6);
        placeLabelAtVectorTip(lbl, origin, wf.vector, displayLen + 0.25);
      } else if (wf.enabled) {
        arrows[key].visible = false;
        const ax = basisAxes[i];
        lbl.visible = true;
        lbl.position.set(
          origin.x + ax.x * axisHintDist,
          origin.y + ax.y * axisHintDist,
          origin.z + ax.z * axisHintDist
        );
      } else {
        arrows[key].visible = false;
        lbl.visible = false;
      }
    });

    setArrow(arrows.Fnet, origin, Fnet);

    const rows = [
      { name: "P", ...P, mag: vecLength(P) },
      { name: "N", ...N, mag: vecLength(N) },
      { name: "f", ...f, mag: vecLength(f) }
    ];
    worldForces.forEach((wf) => {
      if (wf.enabled && wf.magnitude !== 0) {
        rows.push({ name: wf.id, ...wf.vector, mag: Math.abs(wf.magnitude) });
      }
    });
    rows.push({ name: "F_net", ...Fnet, mag: vecLength(Fnet) });

    return { rows, Fnet };
  }

  function dispose() {
    for (const a of Object.values(arrows)) scene.remove(a);
    disposeLabels(forceLabels);
  }

  return { arrows, updateForObject, dispose };
}

export function createCollisionParticles(scene) {
  const particles = [];

  function spawn(position, color = 0xffa500) {
    const count = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      scene.add(mesh);
      particles.push({ mesh, vel, life: 0.6 + Math.random() * 0.4 });
    }
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.material.opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(p.life);
    }
  }

  return { spawn, update };
}
