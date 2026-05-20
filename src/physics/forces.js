import * as CANNON from "cannon-es";

// ── Quaternion math (khong can import THREE) ──────────────────────────────────

/**
 * Xoay vector v bang quaternion q theo cong thuc:
 *   v' = v + 2*qw*(q.xyz x v) + 2*(q.xyz x (q.xyz x v))
 */
function rotateVec(v, q) {
  const { x: vx, y: vy, z: vz } = v;
  const { x: qx, y: qy, z: qz, w: qw } = q;
  // t = 2 * cross(q.xyz, v)
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  // v' = v + qw*t + cross(q.xyz, t)
  return {
    x: vx + qw * tx + (qy * tz - qz * ty),
    y: vy + qw * ty + (qz * tx - qx * tz),
    z: vz + qw * tz + (qx * ty - qy * tx)
  };
}

// ── Data model ────────────────────────────────────────────────────────────────

/** Quaternion don vi (khong xoay) */
export function createDefaultForceFrame() {
  return { x: 0, y: 0, z: 0, w: 1 };
}

/**
 * 3 truc luc vuong goc: F1 doc u, F2 doc v, F3 doc w.
 * magnitude > 0 = cung chieu truc, < 0 = nguoc chieu.
 */
export function createDefaultForceAxes() {
  return [
    { id: "F1", label: "Luc F1", enabled: false, magnitude: 0 },
    { id: "F2", label: "Luc F2", enabled: false, magnitude: 0 },
    { id: "F3", label: "Luc F3", enabled: false, magnitude: 0 }
  ];
}

// ── Tinh toan ─────────────────────────────────────────────────────────────────

/**
 * Tinh 3 truc don vi cua khung luc trong khong gian world tu quaternion.
 * u = F1 direction, v = F2 direction, w = F3 direction.
 */
export function axesFromQuaternion(q) {
  return {
    u: rotateVec({ x: 1, y: 0, z: 0 }, q),
    v: rotateVec({ x: 0, y: 1, z: 0 }, q),
    w: rotateVec({ x: 0, y: 0, z: 1 }, q)
  };
}

/**
 * Tinh vector world cua tung luc tu khung + magnitude.
 * Tra ve mang cac object { id, label, enabled, magnitude, vector:{x,y,z} }.
 */
export function computeWorldForces(forceFrame, forceAxes) {
  const q = forceFrame ?? createDefaultForceFrame();
  const u = rotateVec({ x: 1, y: 0, z: 0 }, q);
  const v = rotateVec({ x: 0, y: 1, z: 0 }, q);
  const w = rotateVec({ x: 0, y: 0, z: 1 }, q);
  const axes = [u, v, w];
  return (forceAxes ?? []).map((fa, i) => {
    const axis = axes[i] ?? u;
    const m = fa.magnitude ?? 0;
    return {
      id: fa.id,
      label: fa.label,
      enabled: fa.enabled,
      magnitude: m,
      vector: { x: axis.x * m, y: axis.y * m, z: axis.z * m }
    };
  });
}

/** Tong vector world cua cac luc dang bat */
export function sumWorldForces(forceFrame, forceAxes) {
  const out = { x: 0, y: 0, z: 0 };
  if (!forceAxes) return out;
  const wf = computeWorldForces(forceFrame, forceAxes);
  for (const f of wf) {
    if (!f.enabled) continue;
    out.x += f.vector.x;
    out.y += f.vector.y;
    out.z += f.vector.z;
  }
  return out;
}

/** Apply 3 luc khung len body (goi moi physics step) */
export function applyForceAxes(body, forceFrame, forceAxes) {
  if (!body || body.mass === 0) return;
  const wf = computeWorldForces(forceFrame, forceAxes);
  for (const f of wf) {
    if (!f.enabled || f.magnitude === 0) continue;
    const { x, y, z } = f.vector;
    body.applyForce(new CANNON.Vec3(x, y, z), body.position);
    body.wakeUp();
  }
}

// ── Backward compat ───────────────────────────────────────────────────────────

/** Con giu de khong loi import o cac file cu */
export function createDefaultCustomForces() {
  return createDefaultForceAxes().map((a) => ({ ...a, vector: { x: 0, y: 0, z: 0 } }));
}

export function applyCustomForces(body, customForces) {
  if (!body || body.mass === 0 || !customForces) return;
  for (const f of customForces) {
    if (!f.enabled) continue;
    const { x, y, z } = f.vector ?? { x: 0, y: 0, z: 0 };
    if (x === 0 && y === 0 && z === 0) continue;
    body.applyForce(new CANNON.Vec3(x, y, z), body.position);
    body.wakeUp();
  }
}

export function sumCustomForces(customForces) {
  const out = { x: 0, y: 0, z: 0 };
  if (!customForces) return out;
  for (const f of customForces) {
    if (!f.enabled) continue;
    const v = f.vector ?? { x: 0, y: 0, z: 0 };
    out.x += v.x; out.y += v.y; out.z += v.z;
  }
  return out;
}

// ── Helpers chung ─────────────────────────────────────────────────────────────

export function vecLength(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function addVec(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function computeWeight(mass, gravityVec) {
  if (mass <= 0) return { x: 0, y: 0, z: 0 };
  return { x: mass * gravityVec.x, y: mass * gravityVec.y, z: mass * gravityVec.z };
}

/** Uoc luong N va f cho HUD (xap xi, chi de hien thi) */
export function estimateContactForces(simObject, gravityVec, surfaceFriction = 0.4) {
  const N = { x: 0, y: 0, z: 0 };
  const f = { x: 0, y: 0, z: 0 };
  if (!simObject || simObject.isStatic || simObject.body.mass <= 0) return { N, f };

  const body = simObject.body;
  const onGround = body.position.y < 2.5 && Math.abs(body.velocity.y) < 8;
  if (onGround) {
    const gLen = vecLength(gravityVec) || 9.82;
    const Nmag = simObject.body.mass * gLen;
    N.y = Nmag;
    const vx = body.velocity.x;
    const vz = body.velocity.z;
    const speed = Math.sqrt(vx * vx + vz * vz);
    if (speed > 0.05) {
      const fmag = surfaceFriction * Nmag;
      f.x = (-vx / speed) * fmag;
      f.z = (-vz / speed) * fmag;
    }
  }
  return { N, f };
}

export function computeFnet(simObject, gravityVec, surfaceFriction) {
  const P = computeWeight(simObject.body.mass, gravityVec);
  // Dung sumWorldForces neu co forceAxes (mo hinh moi), fallback sumCustomForces
  const Fcustom = simObject.forceAxes
    ? sumWorldForces(simObject.forceFrame, simObject.forceAxes)
    : sumCustomForces(simObject.customForces);
  const { N, f } = estimateContactForces(simObject, gravityVec, surfaceFriction);
  return addVec(addVec(addVec(P, Fcustom), N), f);
}
