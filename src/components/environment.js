import * as THREE from "three";

const PRESETS = {
  night: {
    bg: 0x080c14,
    fogColor: 0x080c14,
    fogDensity: 0.012,
    ambient: 0.3,
    hemiSky: 0x1a2744,
    hemiGround: 0x0a0a0a,
    hemiIntensity: 0.4,
    dirColor: 0xc8d8ff,
    dirIntensity: 0.8,
    pointColor: 0xfff0c2,
    pointIntensity: 55,
    point2Color: 0x818cf8,
    point2Intensity: 18,
    gridColor1: 0x1e3a5f,
    gridColor2: 0x0f1f33,
    toneExposure: 1.1
  },
  day: {
    bg: 0x87ceeb,
    fogColor: 0xc8e6f7,
    fogDensity: 0.006,
    ambient: 0.65,
    hemiSky: 0x87ceeb,
    hemiGround: 0x556b2f,
    hemiIntensity: 0.7,
    dirColor: 0xfff8e7,
    dirIntensity: 1.6,
    pointColor: 0xfff8dc,
    pointIntensity: 25,
    point2Color: 0x87ceeb,
    point2Intensity: 8,
    gridColor1: 0x668899,
    gridColor2: 0x445566,
    toneExposure: 1.3
  },
  sunset: {
    bg: 0x2d1b4e,
    fogColor: 0x4a2040,
    fogDensity: 0.01,
    ambient: 0.35,
    hemiSky: 0xff7b54,
    hemiGround: 0x1a0a2e,
    hemiIntensity: 0.55,
    dirColor: 0xff9a5c,
    dirIntensity: 1.2,
    pointColor: 0xffcc77,
    pointIntensity: 45,
    point2Color: 0xcc55aa,
    point2Intensity: 14,
    gridColor1: 0x5a3060,
    gridColor2: 0x2a1540,
    toneExposure: 1.15
  },
  studio: {
    bg: 0x1a1a2e,
    fogColor: 0x1a1a2e,
    fogDensity: 0.003,
    ambient: 0.55,
    hemiSky: 0xffffff,
    hemiGround: 0x444444,
    hemiIntensity: 0.5,
    dirColor: 0xffffff,
    dirIntensity: 1.4,
    pointColor: 0xffffff,
    pointIntensity: 50,
    point2Color: 0xaaccff,
    point2Intensity: 20,
    gridColor1: 0x444466,
    gridColor2: 0x222244,
    toneExposure: 1.2
  }
};

function setColor(light, hex) {
  light?.color?.set(hex);
}

function setGroundColor(light, hex) {
  light?.groundColor?.set(hex);
}

export function applyEnvironment(envName, view) {
  if (!view?.scene || !view?.renderer) return;

  const p = PRESETS[envName] ?? PRESETS.day;
  const { scene, renderer, lights = {}, helpers = {} } = view;

  scene.background = new THREE.Color(p.bg);
  scene.fog = new THREE.FogExp2(p.fogColor, p.fogDensity);
  renderer.toneMappingExposure = p.toneExposure;

  if (lights.ambientLight) lights.ambientLight.intensity = p.ambient;
  setColor(lights.hemisphereLight, p.hemiSky);
  setGroundColor(lights.hemisphereLight, p.hemiGround);
  if (lights.hemisphereLight) lights.hemisphereLight.intensity = p.hemiIntensity;
  setColor(lights.directionalLight, p.dirColor);
  if (lights.directionalLight) lights.directionalLight.intensity = p.dirIntensity;
  setColor(lights.pointLight, p.pointColor);
  if (lights.pointLight) lights.pointLight.intensity = p.pointIntensity;
  setColor(lights.pointLight2, p.point2Color);
  if (lights.pointLight2) lights.pointLight2.intensity = p.point2Intensity;

  const grid = helpers.grid;
  if (grid?.material) {
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMats.forEach((m) => {
      if (m?.color) m.color.set(p.gridColor1);
    });
  }
}

export function getEnvironmentNames() {
  return Object.keys(PRESETS);
}
