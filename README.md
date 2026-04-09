# CS105 — Ứng dụng mô phỏng vật lý 3D

Đồ án môn Đồ hoạ máy tính (CS105) — UIT.  
Mô phỏng vật lý + đồ hoạ 3D dùng **Three.js** và **cannon-es**, kiến trúc module ES6.

## Chạy dự án

```bash
cd CS105
python3 -m http.server 5500
```

Mở trình duyệt: `http://localhost:5500`

## Tính năng

### Hình học 3D (12 loại)
Hộp, Cầu, Nón, Trụ, Bánh xe (Torus), Ấm trà (Teapot), Nút xoắn (TorusKnot), 12 mặt (Dodecahedron), 20 mặt (Icosahedron), 8 mặt (Octahedron), Capsule, Lathe.

### Load model từ file
Hỗ trợ `.glb`, `.gltf`, `.obj` — tự tạo bounding box physics.

### Phép chiếu phối cảnh
Chỉnh `FOV`, `near`, `far` realtime qua panel bên phải.

### Biến đổi Affine
- **Tịnh tiến**: kéo bằng TransformControls hoặc lực W/A/S/D
- **Quay**: TransformControls hoặc Q/E
- **Tỉ lệ**: TransformControls hoặc Z/X (đồng bộ mesh + physics body)

### Chiếu sáng (Phong)
- Ambient Light
- Hemisphere Light
- Point Light × 2
- Directional Light (cast shadow)
- Chỉnh intensity realtime

### Bóng đổ (Shadow Mapping)
- PCFSoftShadowMap
- Shadow bias + radius tuỳ chỉnh

### Texture Mapping
8 preset (grid, wood, metal, brick, marble, checker, lava, grass) + upload ảnh bitmap.

### 5 Scene mô phỏng vật lý
1. **Mặt phẳng nghiêng** — `a = g sin(θ) − μg cos(θ)`
2. **Rơi tự do** — `s = ½gt²`
3. **Lực ngang & ma sát** — `F − f = ma`
4. **Va chạm đàn hồi** — bảo toàn động lượng
5. **Hiệu ứng Domino** — phản ứng dây chuyền

### Tính năng nâng cao
- **TransformControls**: kéo/quay/scale trực quan bằng gizmo
- **Raycasting**: click chọn đối tượng, highlight emissive
- **Hiệu ứng va chạm**: particles khi va đập mạnh
- **Môi trường**: 4 preset (Đêm, Ngày, Hoàng hôn, Studio) — thay đổi fog, sky, ánh sáng
- **HUD realtime**: vị trí, vận tốc, khối lượng, năng lượng (KE + PE)
- **Object list**: xem/chọn/xoá đối tượng trong sidebar
- **Debug mode**: wireframe, bounding box, camera frustum
- **Screenshot**: chụp ảnh viewport
- **FPS counter**

## Phím tắt

| Phím | Chức năng |
|------|-----------|
| W/A/S/D | Tác dụng lực ngang |
| Q/E | Quay đối tượng |
| Z/X | Phóng to / thu nhỏ |
| Space | Bắn lên trên |
| G | Chế độ tịnh tiến (gizmo) |
| R | Chế độ quay (gizmo) |
| T | Chế độ tỉ lệ (gizmo) |
| F | Bật/tắt animation |
| P | Reset scene |
| B | Bật/tắt debug |
| Delete | Xoá đối tượng đang chọn |
| ? | Hiện bảng phím tắt |

## Mapping với kiến thức đồ hoạ

| Khái niệm | Triển khai |
|-----------|-----------|
| **Transformation** | Affine: translate, rotate, scale qua TransformControls + keyboard |
| **Projection** | PerspectiveCamera — FOV/near/far slider |
| **Lighting** | MeshPhongMaterial + 4 loại nguồn sáng |
| **Shadow** | DirectionalLight castShadow + PCFSoftShadowMap |
| **Texture** | UV mapping + CanvasTexture + TextureLoader |
| **Raycasting** | THREE.Raycaster — click chọn đối tượng |
| **Physics** | cannon-es: gravity, friction, restitution, collision |
