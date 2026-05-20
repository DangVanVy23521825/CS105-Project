# CS105 — Kế hoạch đồ án: Sandbox mô phỏng vật lý 3D (THCS)

> Tài liệu chốt định hướng sau khi làm rõ yêu cầu với giảng viên / nhóm phát triển.  
> Cập nhật: 2026-05-18

---

## 1. Định hướng đồ án

### 1.1 Một câu

**Sandbox mô phỏng cơ học cổ điển 3D trên web** cho **học sinh và giáo viên THCS tại Việt Nam**, gắn với chương trình **Vật lý cơ học** (lực, chuyển động, ma sát, va chạm), giúp **hình dung hiện tượng** và **áp dụng công thức** qua số đo, vector lực và đồ thị.

### 1.2 Đối tượng sử dụng

| Đối tượng | Nhu cầu |
|-----------|---------|
| **Giáo viên THCS** | Demo 15–20 phút/tiết; chỉnh nhanh g, μ, góc dốc, lực đẩy; pause/bước chậm; chụp màn hình cho slide |
| **Học sinh THCS** | Quan sát 3D, đọc công thức + bảng lực, so sánh với SGK |

### 1.3 Mục tiêu học thuật (kết quả mong muốn)

- Khi **bắt đầu cảnh**, vật có vận tốc/chuyển động phù hợp **tổng hợp lực** (trọng lực, phản lực, ma sát mặt, tối đa **3 lực do giáo viên gắn**).
- Giáo viên **thay đổi nhanh**: g, μ **mặt cảnh**, góc θ (dốc), khối lượng, và **các vector lực tùy chỉnh** trên vật thí nghiệm.
- Mỗi cảnh có **công thức HUD** + (theo cảnh) **so sánh số lý thuyết / đo**, **đồ thị v–t** (và s–t khi có thể).
- Simulation **xấp xỉ** (cannon-es, bước 1/60); báo cáo ghi nhận sai số nhỏ so với mô hình điểm.

### 1.4 Tiêu chí thành công

1. **Đủ điểm môn CS105** — web chạy ổn, demo bảo vệ; báo cáo vẫn mapping đồ họa (projection, Phong, shadow, texture).
2. **Giáo viên dùng được ~15–20 phút** một cảnh mà không cần hướng dẫn kỹ thuật web.

### 1.5 Phạm vi cắt (đã chốt)

| Loại bỏ | Giữ lại |
|---------|---------|
| 10+ hình khối trang trí | Chỉ **Hộp (box)** và **Cầu (sphere)** cho thí nghiệm |
| 4 môi trường (đêm, hoàng hôn, studio…) | Chỉ môi trường **sáng (day)** |
| Cảnh **Domino** | **4 cảnh** cơ học (xem §4) |
| Ma sát trên từng vật thí nghiệm | μ chỉ trên **mặt cảnh** (sàn, dốc) |
| Spawn tự do không giới hạn | Spawn tối đa **2–3** vật thí nghiệm / cảnh |
| Export CSV (giai đoạn này) | Chụp màn hình |
| Load model GLB (ưu tiên thấp, cắt nếu thiếu giờ) | — |

---

## 2. Hệ vector lực (trả lời thắc mắc & quy tắc)

### 2.1 Có thể tùy ý chiều và độ lớn trong 3D không?

**Có — về mặt kỹ thuật.** Mỗi lực tùy chỉnh là vector **(Fx, Fy, Fz)** hoặc **(độ lớn, hướng)** trong không gian 3D; engine áp dụng qua `body.applyForce()` mỗi bước simulation.

**Đã chốt:** lực tùy chỉnh **đầy đủ 3D** (không khóa mặt phẳng) — giáo viên có thể đặt bất kỳ hướng nào; khi giảng nên nhắc học sinh quy chiếu theo trục hoặc theo mặt dốc/sàn.

### 2.2 Vật có chuyển động theo tổng vector lực không?

**Có — theo định luật II Newton:** `a = F_net / m`.

| Thành phần | Nguồn | Ghi chú |
|------------|--------|---------|
| **P** (trọng lực) | `m · g` (vector g cảnh) | Luôn có với vật có khối lượng |
| **N** (phản lực) | Tiếp xúc mặt / dốc | Tự tính từ engine, không chỉnh tay |
| **f** (ma sát) | μ · N, ngược hướng trượt tương đối | μ từ **mặt cảnh**, không gắn trên vật |
| **F₁, F₂, F₃** | Giáo viên gắn (tối đa 3) | Lực chủ động; **bật/tắt từng vector**; chỉnh **3D** |
| **F_net** | Tổng vector tất cả lực trên | Quyết định gia tốc; vận tốc tích phân theo thời gian |

Hiển thị: **mũi tên có nhãn + bảng số (N)** + **F_net** (đã chốt).

### 2.3 Số lượng vector lực tối đa

| Loại | Số lượng | Chỉnh được? |
|------|----------|-------------|
| Trọng lực **P** | 1 (từ m·g) | g cảnh |
| Ma sát **f** | 1 (khi có tiếp xúc + trượt) | μ **mặt cảnh** |
| Phản lực **N** | 1 (khi có tiếp xúc) | Không (phản ứng) |
| **Lực tùy chỉnh** | **Tối đa 3** | Chiều + độ lớn (và bật/tắt — xem §2.4) |

**Không** tính P và f vào giới hạn 3.

### 2.4 Cách chỉnh & hành vi (đã chốt — cập nhật 2026-05-18)

| Hạng mục | Quyết định |
|----------|------------|
| **Mô hình lực** | 3 lực F1, F2, F3 **vuông góc nhau** gắn tại trọng tâm vật, tạo thành một "khung lực" (forceFrame). Xoay khung → cả 3 lực quay cùng nhau, vẫn giữ vuông góc nhau |
| **Chỉnh hướng** | Kéo **vòng tròn màu cam/tím** (gizmo xoay) xung quanh vật để xoay forceFrame trong không gian 3D |
| **Chỉnh độ lớn** | Slider **\|F1\| \|F2\| \|F3\|** (−200 → 200 N) trong panel lil-gui. Âm = ngược chiều trục |
| **Bật / Tắt** | Mỗi slot có checkbox **Bật F1/F2/F3** riêng |
| **Hiển thị hướng** | Panel tự động hiển thị vectơ đơn vị u, v, w hiện tại sau khi xoay |
| **Phím W/A/S/D** | Nhanh tay: tự động đặt forceFrame hướng theo phím bấm và bật F1 = 40 N |

```text
SimObject.forceFrame = { x, y, z, w }  // quaternion xoay khung, mặc định identity
SimObject.forceAxes[i] = {
  id:        "F1" | "F2" | "F3"
  label:     string
  enabled:   boolean
  magnitude: number  // đơn vị N; âm = ngược chiều trục
}
// Vectơ world F1 = rotateVec(+X, forceFrame) * magnitude
// Vectơ world F2 = rotateVec(+Y, forceFrame) * magnitude
// Vectơ world F3 = rotateVec(+Z, forceFrame) * magnitude
```

---

## 3. Mô hình đối tượng

### 3.1 Vật thí nghiệm (`SimObject`)

```text
SimObject {
  kind:       "box" | "sphere"
  label:      string          // ví dụ "Quả cầu 2 kg"
  mass:       number (kg)     // isStatic → coi như mass = 0
  isStatic:   boolean
  mesh, body                    // đồng bộ Three.js ↔ cannon-es
  customForces: [               // tối đa 3 phần tử
    { id, label, enabled, vector: Vec3 }  // đơn vị N
  ]
}
```

- **Spawn:** tối đa **2–3** vật thí nghiệm thêm trong cảnh (ngoài vật preset).
- **Hình học:** chỉ factory `createBox`, `createSphere` trong UI spawn.

### 3.2 Mặt cảnh (`SceneSurface`)

```text
SceneSurface {
  label:      string          // "Sàn", "Mặt phẳng nghiêng"
  isStatic:   true
  friction:   μ               // chỉ lớp này có μ
  angle?:     θ (rad)         // chỉ ramp
  mesh, body
}
```

- Cảnh **Mặt phẳng nghiêng** tự có mesh **dốc** (static) + sàn.
- `ContactMaterial`: ghép **vật thí nghiệm ↔ SceneSurface** với μ của mặt.

### 3.3 Tham số hai tầng (đã chốt)

| Tầng | Tham số | Áp dụng |
|------|---------|---------|
| **Cảnh** | g, μ sàn/dốc, θ dốc, e (va chạm) | Toàn cảnh |
| **Vật chọn** | mass, F₁,F₂,F₃, bật/tắt lực | Chỉ vật đang chọn |

---

## 4. Bốn cảnh mô phỏng

### 4.1 Mặt phẳng nghiêng

| Hạng mục | Nội dung |
|----------|----------|
| **Preset** | 1 dốc (static) + 1–2 vật (cầu/hộp) trên dốc |
| **Công thức** | `a = g·sinθ − μ·g·cosθ` |
| **Kết quả** | Quan sát; **a đo ≈ a lý thuyết**; **đồ thị v–t** (và s–t nếu kịp) |
| **Chỉnh nhanh** | θ, μ dốc, g, mass; lực tùy chỉnh (trong mặt phẳng dốc nếu bật giới hạn) |

### 4.2 Rơi tự do

| Hạng mục | Nội dung |
|----------|----------|
| **Preset** | 2 vật **khối lượng khác** (1 cầu + 1 hộp), cùng độ cao thả |
| **Công thức** | `s = ½gt²`; Galileo: cùng g, không phụ thuộc m |
| **Kết quả** | Chạm đất gần như cùng lúc; hiện **t**, **s** đo được |
| **Chỉnh nhanh** | g, độ cao thả |

### 4.3 Lực ngang & ma sát

| Hạng mục | Nội dung |
|----------|----------|
| **Preset** | 1 vật trên mặt phẳng ngang |
| **Công thức** | `F − f = ma`, `f = μN` (**một μ**, đủ THCS) |
| **Kết quả** | Đứng yên khi F ≤ μN; trượt khi F > μN; bảng F, f, N, F_net |
| **Chỉnh nhanh** | μ sàn, **F đẩy** (slider + phím), g; tối đa 3 vector lực |

### 4.4 Va chạm (1 chiều, 2 vật) — đã chốt

| Hạng mục | Nội dung |
|----------|----------|
| **Preset** | **2 quả cầu** (hoặc 1 cầu + 1 hộp), vận tốc ban đầu ngược chiều trên **1 trục** |
| **Công thức** | `m₁v₁ + m₂v₂ = const` |
| **Kết quả** | Bảng **động lượng trước / sau**; quan sát ảnh hưởng **e** |
| **Chỉnh nhanh** | m₁, m₂, v₁₀, v₂₀, e |
| **Loại bỏ** | “Sân chơi” nhiều vật ngẫu nhiên |

---

## 5. Action → Outcome

| Action | Tầng | Kết quả mong đợi |
|--------|------|------------------|
| Chọn vật (click / list) | Vật | Highlight; HUD; bảng lực + mũi tên P, N, f, F₁–₃, F_net |
| Chỉnh **g** | Cảnh | Rơi / trượt thay đổi; công thức HUD cập nhật |
| Chỉnh **μ** mặt | Cảnh | Ngưỡng trượt / a trên dốc thay đổi |
| Chỉnh **θ** | Cảnh (dốc) | a lý thuyết và chuyển động đổi |
| Chỉnh **F₁,F₂,F₃** | Vật | Vector và F_net đổi; chuyển động theo tổng lực |
| Bật/tắt F₁, F₂, F₃ | Vật | Chỉ lực đang bật tham gia F_net và applyForce |
| Kéo gizmo / nhập Fx,Fy,Fz | Vật | Cập nhật vector lực; mũi tên đồng bộ |
| **Reset cảnh** | Cảnh | Vị trí & vận tốc ban đầu; giữ tham số cảnh |
| **Pause / bước chậm** | Điều khiển | Dừng đúng lúc va chạm / chạm đất |
| Spawn hộp/cầu (≤3) | Vật | Thêm thí nghiệm phụ |
| Chụp màn hình | Xuất | Slide / báo cáo |
| Phím W/A/S/D, Space | Vật | Lực nhanh (có thể map vào F₁ hoặc thay bằng slider) |

---

## 6. Kiến trúc kỹ thuật (tham chiếu)

```text
index.html          → UI sidebar (4 cảnh, 2 spawn, env day)
src/state.js        → currentScene, selectedObject, sceneParams
src/engine/
  physics.js        → World, g, ContactMaterial theo SceneSurface
  sceneManager.js   → 4 init* cảnh, spawn box/sphere
  view.js           → Scene, camera, lights (báo cáo CS105)
src/components/
  geometries.js     → createBox, createSphere, createGround, ramp
  visualizers.js    → mũi tên + (mới) force table / graphs
  environment.js    → chỉ preset "day"
src/interaction/
  input.js          → raycast, TransformControls (vị trí vật)
  ui.js             → lil-gui: g, μ, θ, F slots, pause/step
src/main.js         → loop, HUD, đồ thị, áp dụng customForces
```

**Luồng lực mỗi frame (mục tiêu):**

1. Tính **P** từ g và m.  
2. Áp dụng **F₁,F₂,F₃** (nếu enabled) lên `body`.  
3. `world.step(1/60)` → engine tính **N**, **f** từ tiếp xúc.  
4. Đọc vận tốc / gia tốc → cập nhật HUD, bảng lực, đồ thị.  
5. `mesh` sync từ `body`.

---

## 7. Lộ trình triển khai

### Phase 1 — Cắt phạm vi & chuẩn hóa dữ liệu
- [x] Xóa cảnh Domino; xóa scene card & `initDominoChain`.
- [x] Spawn grid: chỉ **Hộp**, **Cầu**; xóa factory khỏi `SPAWN_MAP` / UI.
- [x] Môi trường: chỉ **day**; xóa nút env khác.
- [x] Thêm `label`, `isStatic` rõ trên mọi object; μ chuyển sang `SceneSurface`.
- [x] Giới hạn spawn ≤ 3 vật động / cảnh.

### Phase 2 — Hệ lực (3 vector + bảng + mũi tên)
- [x] Cấu trúc `customForces[3]` trên `SimObject`.
- [x] UI chỉnh lực: 3 slot, bật/tắt, nhập số (§2.4); gizmo 3D kéo mũi tên — chưa (có thể bổ sung).
- [x] Refactor `visualizers.js`: P, N, f, F₁–₃, F_net + bảng N.
- [x] Áp dụng lực mỗi frame; map phím W/A/S/D → F₁.

### Phase 3 — Từng cảnh & đo lường
- [x] **Inclined:** so sánh a lý thuyết / đo; đồ thị v–t.
- [x] **Free fall:** 2 khối lượng; t, s; Galileo.
- [x] **Horizontal:** μ một giá trị; F qua F1–F3 / phím.
- [x] **Collision:** 2 vật 1D; động lượng trước/sau; chỉnh e.

### Phase 4 — Điều khiển giảng dạy
- [x] Pause / simulation step.
- [x] Reset cảnh ổn định (`initialState`).
- [x] Chụp màn hình (đã có).

### Phase 5 — Báo cáo & bảo vệ CS105
- [x] README: mục “Cho lớp THCS” vs “Mapping CS105”.
- [ ] Slide: 4 cảnh + 1 sơ đồ kiến trúc + bảng công thức.
- [x] Comment tiếng Việt tại chỗ xử lý lực (`forces.js`, `surfaces.js`).

---

## 8. Mapping CS105 (báo cáo — giữ full như hiện tại)

| Khái niệm | Triển khai |
|-----------|------------|
| Transformation | Affine: translate / rotate / scale (TransformControls) |
| Projection | PerspectiveCamera — FOV, near, far |
| Lighting | MeshPhongMaterial + ambient / point / directional |
| Shadow | DirectionalLight + PCFSoftShadowMap |
| Texture | UV + preset + upload (tối giản runtime nếu cần) |
| Raycasting | Chọn vật |
| Physics | cannon-es — minh họa F_net, μ, e |

---

## 9. Ghi chú & rủi ro

- **Ma sát cannon-es** là một μ cho cặp tiếp xúc — không tách tĩnh/động; chấp nhận cho THCS, ghi trong báo cáo.
- **Lực 3D tùy ý** có thể khó với lớp 8 — giáo viên nên demo trong cảnh đã có sẵn lực “đúng bài” (preset F chủ yếu theo trục quan trọng).
- **TransformControls kéo vật** đặt lại vận tốc = 0 — cần phân biệt “đặt lại thí nghiệm” vs “đang chạy simulation”.

---

## 10. Lịch sử chốt yêu cầu

| Ngày | Nội dung |
|------|----------|
| 2026-05-18 | Định hướng THCS; 2 hình; env day; bỏ Domino; 2 cầu va chạm; max 3 lực tùy chỉnh; μ trên mặt; đồ thị + so sánh a; pause/step; deliverable: web chạy ổn |
| 2026-05-18 | Lực: 3D đầy đủ; bật/tắt từng F; chỉnh bằng số + gizmo |

---

*Tệp này là nguồn tham chiếu chính khi implement.*
