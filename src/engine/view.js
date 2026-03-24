import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createView(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(12, 10, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 2.5, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.38);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xfff0c2, 55, 100);
  pointLight.position.set(8, 10, 2);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.set(1024, 1024);
  scene.add(pointLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
  directionalLight.position.set(-8, 15, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 80;
  directionalLight.shadow.camera.left = -25;
  directionalLight.shadow.camera.right = 25;
  directionalLight.shadow.camera.top = 25;
  directionalLight.shadow.camera.bottom = -25;
  scene.add(directionalLight);

  const grid = new THREE.GridHelper(80, 80, 0x334155, 0x1f2937);
  scene.add(grid);

  const axes = new THREE.AxesHelper(6);
  scene.add(axes);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
    lights: { ambientLight, pointLight, directionalLight },
    helpers: { grid, axes },
    dispose
  };
}
