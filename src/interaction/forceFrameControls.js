import * as THREE from "three";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { createForceLabel, disposeLabels } from "../components/forceLabels.js";

/**
 * Gizmo xoay "khung luc" (forceFrame) tai trong tam vat.
 * Xoay gizmo → cac truc u,v,w cua F1,F2,F3 quay cung nhau (van vuong goc).
 */
export function createForceFrameControls({ renderer, camera, scene, orbitControls }) {
  // Object3D rong — khong render, chi luu quaternion cua khung luc
  const pivot = new THREE.Object3D();
  pivot.name = "ForceFramePivot";
  // Khong dua vao raycasting
  pivot.traverse((o) => { o.raycast = () => {}; });
  scene.add(pivot);

  // 3 mui ten ngan the hien huong cua tung truc
  const arrowColors = [0xf97316, 0xfb923c, 0xa78bfa];
  const axisVectors = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1)
  ];
  const axisArrows = axisVectors.map((dir, i) => {
    const a = new THREE.ArrowHelper(dir, new THREE.Vector3(), 1.8, arrowColors[i], 0.25, 0.15);
    a.raycast = () => {};
    pivot.add(a);
    return a;
  });

  // Nhan F1/F2/F3 o dau moi truc (con cua pivot → xoay cung khung luc)
  const axisLabelOffset = 2.05;
  const axisLabels = {
    F1: createForceLabel("F1", "#f97316"),
    F2: createForceLabel("F2", "#fb923c"),
    F3: createForceLabel("F3", "#a78bfa")
  };
  axisLabels.F1.position.set(axisLabelOffset, 0, 0);
  axisLabels.F2.position.set(0, axisLabelOffset, 0);
  axisLabels.F3.position.set(0, 0, axisLabelOffset);
  pivot.add(axisLabels.F1, axisLabels.F2, axisLabels.F3);

  // TransformControls chi de xoay pivot
  const controls = new TransformControls(camera, renderer.domElement);
  controls.setMode("rotate");
  controls.setSize(0.85);
  controls.attach(pivot);
  controls.visible = false;
  scene.add(controls);

  controls.addEventListener("dragging-changed", (e) => {
    orbitControls.enabled = !e.value;
  });

  let currentObject = null;
  let onChangeCallback = null;

  controls.addEventListener("objectChange", () => {
    if (!currentObject) return;
    // Dong bo quaternion pivot -> forceFrame cua vat
    const q = pivot.quaternion;
    currentObject.forceFrame.x = q.x;
    currentObject.forceFrame.y = q.y;
    currentObject.forceFrame.z = q.z;
    currentObject.forceFrame.w = q.w;
    onChangeCallback?.();
  });

  function setVisible(v) {
    controls.visible = v;
    pivot.visible = v;
  }

  /** Gan vat thi nghiem vao gizmo */
  function attach(simObject, onChange) {
    currentObject = simObject;
    onChangeCallback = onChange;
    if (simObject) {
      const p = simObject.body.position;
      pivot.position.set(p.x, p.y, p.z);
      const q = simObject.forceFrame;
      pivot.quaternion.set(q.x, q.y, q.z, q.w);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }

  function detach() {
    currentObject = null;
    onChangeCallback = null;
    setVisible(false);
  }

  /** Goi moi frame de pivot bam theo vi tri vat */
  function update() {
    if (!currentObject || !pivot.visible) return;
    const p = currentObject.body.position;
    pivot.position.set(p.x, p.y, p.z);
  }

  function dispose() {
    controls.dispose();
    disposeLabels(axisLabels);
    scene.remove(pivot);
    scene.remove(controls);
  }

  return { controls, pivot, axisArrows, axisLabels, attach, detach, update, dispose };
}
