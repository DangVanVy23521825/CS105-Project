import * as THREE from "three";

export function createForceVisualizers(scene) {
  // Arrow helpers hien thi cac luc tac dung len doi tuong
  const gravity = new THREE.ArrowHelper(
    new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 8, 0), 4, 0x60a5fa, 0.4, 0.22
  );
  const applied = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 0, 0xf97316, 0.35, 0.2
  );
  const normal = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 0, 0x34d399, 0.3, 0.18
  );

  gravity.visible = true;
  applied.visible = false;
  normal.visible = false;

  scene.add(gravity, applied, normal);

  function updateForObject(simObject, appliedForceVector) {
    if (!simObject) {
      applied.visible = false;
      normal.visible = false;
      return;
    }

    const p = simObject.mesh.position;
    const forceLen = appliedForceVector.length();

    if (forceLen > 0.01) {
      applied.visible = true;
      applied.position.set(p.x, p.y + 1.2, p.z);
      applied.setDirection(appliedForceVector.clone().normalize());
      applied.setLength(Math.min(forceLen * 0.05, 5), 0.35, 0.2);
    } else {
      applied.visible = false;
    }

    normal.visible = true;
    normal.position.set(p.x, p.y + 0.2, p.z);
    normal.setDirection(new THREE.Vector3(0, 1, 0));
    normal.setLength(2.2, 0.24, 0.12);
  }

  function dispose() {
    scene.remove(gravity, applied, normal);
  }

  return { arrows: { gravity, applied, normal }, updateForObject, dispose };
}

export function createCollisionParticles(scene) {
  const particles = [];

  function spawn(position, color = 0xffa500) {
    const count = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      scene.add(mesh);
      particles.push({ mesh, vel, life: 0.6 + Math.random() * 0.4 });
    }
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.material.opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(p.life);
    }
  }

  return { spawn, update };
}
