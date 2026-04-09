import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createView(container) {
  // Khoi tao scene, camera (phep chieu phoi canh), renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080c14);

  // Suong mu tang chieu sau khong gian (depth cue)
  scene.fog = new THREE.FogExp2(0x080c14, 0.012);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    250
  );
  camera.position.set(14, 11, 14);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  // PCFSoftShadowMap: ky thuat shadow mapping mem
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 2.5, 0);

  // ─── He thong chieu sang Phong: Ambient + Point + Directional + Hemisphere ───
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0x2a1a0a, 0.4);
  scene.add(hemisphereLight);

  const pointLight = new THREE.PointLight(0xfff0c2, 55, 120);
  pointLight.position.set(8, 12, 4);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.set(1024, 1024);
  pointLight.shadow.radius = 3;
  scene.add(pointLight);

  // Nguon sang point phu (accent)
  const pointLight2 = new THREE.PointLight(0x818cf8, 18, 60);
  pointLight2.position.set(-10, 8, -6);
  scene.add(pointLight2);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(-8, 18, 12);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 80;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = -0.0003;
  scene.add(directionalLight);

  // Luoi va truc toa do tham khao
  const grid = new THREE.GridHelper(80, 80, 0x1e3a5f, 0x0f1f33);
  grid.material.opacity = 0.45;
  grid.material.transparent = true;
  scene.add(grid);

  const axes = new THREE.AxesHelper(5);
  axes.material.transparent = true;
  axes.material.opacity = 0.6;
  scene.add(axes);

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener("resize", onResize);

  function dispose() {
    window.removeEventListener("resize", onResize);
    controls.dispose();
    renderer.dispose();
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    lights: {
      ambientLight,
      hemisphereLight,
      pointLight,
      pointLight2,
      directionalLight
    },
    helpers: { grid, axes },
    dispose
  };
}
