export const state = {
  currentScene: "Inclined Plane",
  selectedObject: null,
  debugMode: false,
  autoAnimation: true,
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
