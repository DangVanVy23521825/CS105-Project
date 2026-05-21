import { momentum1D } from "./metrics.js";

/**
 * Theo doi dong luong truoc/sau va cham giua 2 vat thi nghiem.
 * Dung beginContact / endContact cua cannon-es (on dinh hon setTimeout).
 */
export function createCollisionMomentumTracker(getExperimentObjects) {
  const bodyToObject = new WeakMap();

  let before = null;
  let after = null;
  let lockedAfter = false;

  function refreshBodyMap(objects) {
    for (const o of objects) {
      bodyToObject.set(o.body, o);
    }
  }

  function resetMetrics() {
    before = null;
    after = null;
    lockedAfter = false;
  }

  function isExperimentPair(bodyA, bodyB) {
    const a = bodyToObject.get(bodyA);
    const b = bodyToObject.get(bodyB);
    return (
      a &&
      b &&
      a.role === "experiment" &&
      b.role === "experiment" &&
      a.body.mass > 0 &&
      b.body.mass > 0
    );
  }

  function handleBeginContact(event) {
    const { bodyA, bodyB } = event;
    if (!isExperimentPair(bodyA, bodyB)) return;
    if (before === null) {
      before = momentum1D(getExperimentObjects());
      lockedAfter = false;
    }
  }

  function handleEndContact(event) {
    const { bodyA, bodyB } = event;
    if (!isExperimentPair(bodyA, bodyB)) return;
    if (before !== null && !lockedAfter) {
      after = momentum1D(getExperimentObjects());
      lockedAfter = true;
    }
  }

  function getMetrics() {
    return { before, after };
  }

  return {
    refreshBodyMap,
    handleBeginContact,
    handleEndContact,
    getMetrics,
    resetMetrics
  };
}
