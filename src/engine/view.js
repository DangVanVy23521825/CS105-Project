import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function readContainerSize(container) {
  const w = container.clientWidth || window.innerWidth - 272;
  const h = container.clientHeight || window.innerHeight - 52;
  return { width: Math.max(1, w), height: Math.max(1, h) };
}

export function createView(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  // Suong mu — tang cam giac chieu sau (depth cue) trong khong gian 3D
  scene.fog = new THREE.FogExp2(0xc8e6f7, 0.006);

  const { width, height } = readContainerSize(container);

  // PerspectiveCamera: phep chieu phoi canh (FOV, near, far)
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 250);
  camera.position.set(14, 11, 14);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  // Bat shadow mapping — ky thuat do bong bang depth map tu nguon sang
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 2.5, 0);

  // ─── Mo hinh chieu sang Phong: I = I_ambient + I_diffuse + I_specular ───

  // Anh sang moi truong (ambient) — chieu sang deu khap canh, khong co huong
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.45);
  scene.add(hemisphereLight);

  // Anh sang diem (point) — phat tu 1 diem, giam cuong do theo khoang cach
  const pointLight = new THREE.PointLight(0xfff8dc, 40, 120);
  pointLight.position.set(8, 12, 4);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.set(1024, 1024);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(0x87ceeb, 8, 80);
  pointLight2.position.set(-6, 8, -4);
  scene.add(pointLight2);

  // Anh sang dinh huong (directional) — song song, mo phong mat troi
  const directionalLight = new THREE.DirectionalLight(0xfff8e7, 1.2);
  directionalLight.position.set(-8, 18, 12);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 80;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.bias = -0.0003;
  scene.add(directionalLight);

  const grid = new THREE.GridHelper(80, 80, 0x668899, 0x445566);
  grid.material.opacity = 0.45;
  grid.material.transparent = true;
  scene.add(grid);

  const axes = new THREE.AxesHelper(5);
  axes.material.transparent = true;
  axes.material.opacity = 0.6;
  scene.add(axes);

  function onResize() {
    const size = readContainerSize(container);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
  }
  window.addEventListener("resize", onResize);
  requestAnimationFrame(onResize);

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
    lights: { ambientLight, hemisphereLight, pointLight, pointLight2, directionalLight },
    helpers: { grid, axes },
    dispose
  };
}
