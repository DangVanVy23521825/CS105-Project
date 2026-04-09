// Trang thai toan cuc (Centralized State)
export const state = {
  currentScene: "Inclined Plane",
  selectedObject: null,
  debugMode: false,
  autoAnimation: true,
  environment: "night",
  transformMode: "translate",
  objects: [],
  helpers: {
    boxHelpers: [],
    cameraHelper: null,
    wireframes: []
  }
};

export function setSelectedObject(target) {
  state.selectedObject = target;
}
