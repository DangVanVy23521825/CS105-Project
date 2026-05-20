import * as THREE from "three";

export function theoreticalRampA(g, thetaRad, mu) {
  return g * Math.sin(thetaRad) - mu * g * Math.cos(thetaRad);
}

export function measureAcceleration(body, prevVelocity, dt) {
  if (!body || dt <= 0.0001 || !prevVelocity) return 0;
  const dv = new THREE.Vector3(
    body.velocity.x - prevVelocity.x,
    body.velocity.y - prevVelocity.y,
    body.velocity.z - prevVelocity.z
  );
  return dv.length() / dt;
}

export function measureAccelerationAlongRamp(body, prevVelocity, dt, thetaRad) {
  if (!body || dt <= 0.0001 || !prevVelocity) return 0;
  const axis = new THREE.Vector3(Math.cos(thetaRad), Math.sin(thetaRad), 0);
  const vNow = new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z);
  const vPrev = new THREE.Vector3(prevVelocity.x, prevVelocity.y, prevVelocity.z);
  return (vNow.dot(axis) - vPrev.dot(axis)) / dt;
}

export function momentum1D(objects, axis = "x") {
  let p = 0;
  for (const o of objects) {
    if (o.role !== "experiment" || o.body.mass <= 0) continue;
    const v = o.body.velocity[axis];
    p += o.body.mass * v;
  }
  return p;
}

export function cloneVelocity(body) {
  return { x: body.velocity.x, y: body.velocity.y, z: body.velocity.z };
}

export function fallHeight(y0, y) {
  return Math.max(0, y0 - y);
}
