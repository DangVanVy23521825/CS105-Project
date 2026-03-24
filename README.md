# Do an CS105 - Ung dung mo phong vat ly 3D

Du an mo phong vat ly + do hoa 3D dung `Three.js` va `cannon-es`, bo tri theo kien truc module de de bao tri va de trinh bay khi van dap.

## Chay du an

Vi du an dung ES Modules + CDN, ban chi can mot static server:

```bash
python3 -m http.server 5500
```

Sau do mo: `http://localhost:5500`

## Tinh nang da trien khai

- Ve khoi co ban: hop, cau, non, tru, banh xe (torus), am tra (teapot)
- Load model tu file cuc bo (`.glb/.gltf/.obj`)
- Perspective projection voi tham so `fov`, `near`, `far`
- Bien doi affine: tinh tien (luc W/A/S/D), quay (`Q/E`), scale (`Z/X`)
- He thong chieu sang Phong: ambient + point + directional
- Bong do shadow mapping (`PCFSoftShadowMap`)
- Texture mapping: preset (`grid`, `wood`, `metal`) + load bitmap tu file
- Raycasting de chon doi tuong, to sang emissive khi duoc chon
- 4 canh vat ly:
  - Inclined Plane
  - Free Fall
  - Horizontal Force
  - Collision Playground
- Debug mode: wireframe, box helper, camera frustum helper
- FPS monitor (Stats.js)

## Phim tat

- Chuot trai: chon doi tuong
- Chuot phai + keo: orbit camera
- `W/A/S/D`: tac dung luc ngang len doi tuong duoc chon
- `Q/E`: quay doi tuong duoc chon
- `Z/X`: phong to/thu nho doi tuong duoc chon
- `F`: bat/tat animation bonus
- `R`: reset scene hien tai

## Mapping voi kien thuc do hoa

- **Transformation**: cap nhat `mesh` va `body` khi rotate/scale
- **Projection**: camera perspective co slider `near/far/fov`
- **Lighting**: `MeshPhongMaterial` + 3 nguon sang
- **Shadow**: directional light cast shadow + PCF soft shadow map
- **Texture**: UV mapping tren geometry + repeat wrapping
- **Physics**: dong bo `mesh <- body` moi frame va dieu chinh friction/restitution realtime
