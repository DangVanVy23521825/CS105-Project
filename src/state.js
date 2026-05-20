// Trang thai toan cuc (Centralized State)
export const state = {
  currentScene: "Inclined Plane",
  selectedObject: null,
  debugMode: false,
  autoAnimation: false,
  environment: "day",
  transformMode: "translate",
  simulationPaused: false,
  timeScale: 1,
  stepOnce: false,
  objects: [],
  sceneParams: {
    gravity: 9.82,
    friction: 0.4,
    restitution: 0.35,
    rampAngleDeg: 27
  },
  metrics: {
    collisionMomentumBefore: null,
    collisionMomentumAfter: null,
    fallStartTime: null
  },
  helpers: {
    boxHelpers: [],
    cameraHelper: null,
    wireframes: []
  }
};

export function setSelectedObject(target) {
  state.selectedObject = target;
}
