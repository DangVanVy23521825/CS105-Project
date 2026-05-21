# MỤC LỤC BÁO CÁO ĐỒ ÁN — CS105 ĐỒ HỌA MÁY TÍNH

> **Hướng dẫn:** Copy nội dung này sang file Word (`Doc/BAO_CAO_<MSSV>.docx`).  
> Điền **[...]**, chèn ảnh chụp màn hình, bảng số từ demo thực tế.  
> Đồ án chính: **Sandbox mô phỏng vật lý 3D (THCS)** — `index.html` + `src/`.  
> Lab thực hành: `23521825_Lab06/` (Chiếu sáng + Texture).

---

## THÔNG TIN BÌA (trang 1)

- Trường: Đại học Quốc gia TP.HCM — Trường ĐH Công nghệ Thông tin  
- Môn: **Đồ họa máy tính (CS105)**  
- Đề tài: **Ứng dụng mô phỏng vật lý 3D trên Web**  
- Sinh viên: **[Họ tên]** — MSSV: **[23521825]**  
- Lớp: **[...]** — Giảng viên: **TS. Mai Tiến Dũng**  
- Năm học: **[2025–2026]**

---

## MỤC LỤC (trang 2)

1. Giới thiệu  
2. Cơ sở lý thuyết  
3. Phân tích yêu cầu  
4. Thiết kế hệ thống  
5. Cài đặt và triển khai  
6. Kết quả thực nghiệm  
7. Kết luận và hướng phát triển  
8. Tài liệu tham khảo  
Phụ lục A: Hướng dẫn chạy chương trình  
Phụ lục B: Mapping CLO / đề đồ án / mã nguồn  
Phụ lục C: Lab 06 (Chiếu sáng & Texture)

---

## CHƯƠNG 1 — GIỚI THIỆU (2–3 trang)

### 1.1 Lý do chọn đề tài

- Môn CS105 yêu cầu mô phỏng **hình học 3D, hiển thị, chiếu sáng, biến đổi, texture, chuyển động** (theo đề Đồ án ĐHMT).  
- Đề tài gợi ý số **7: Ứng dụng mô phỏng vật lý 3D** — phù hợp chương trình Vật lý THCS.  
- Mục tiêu: giáo viên/học sinh **quan sát hiện tượng** + **đối chiếu công thức** (SGK), không chỉ xem hình tĩnh.

**Viết 1 đoạn:** Nêu pain point lớp học (khó hình dung vector lực, ma sát, va chạm) → giải pháp sandbox web.

### 1.2 Mục tiêu đồ án

| Mục tiêu | Mô tả ngắn |
|----------|------------|
| **CG / CLO** | Vận dụng pipeline đồ họa 3D (CLO2–CLO4) |
| **Đồ án ĐHMT** | Đủ 2.1.1.1 → 2.1.1.6 (cơ bản + animation) |
| **Giáo dục** | 4 cảnh cơ học THCS, HUD công thức, vector lực |
| **Kỹ thuật** | Web ổn định, demo bảo vệ 15–20 phút |

### 1.3 Phạm vi

**Trong phạm vi:** 4 cảnh, hộp/cầu, Phong + shadow + texture, biến đổi affine, 3 lực F1–F3, μ mặt cảnh.  
**Ngoài phạm vi:** Ray tracing CPU, game đầy đủ, nhiều hình trang trí, Domino, load GLB (ưu tiên thấp).  
*(Tham chiếu [PLAN.md](../PLAN.md) §1.5)*

### 1.4 Công cụ

- **Three.js** — render 3D (WebGL)  
- **cannon-es** — mô phỏng vật lý  
- **lil-gui** — panel tham số  
- Trình duyệt + `python -m http.server`

---

## CHƯƠNG 2 — CƠ SỞ LÝ THUYẾT (4–6 trang)

> Map với **đề cương CS105**: Chương 3, 4, 6. Không viết dài phần Rasterization thuần 2D trừ khi so sánh.

### 2.1 Tổng quan đồ họa máy tính (CLO1)

- Định nghĩa CG, pipeline hiển thị, ứng dụng.  
- **1 hình:** sơ đồ pipeline (Application → Geometry → Rasterization → Pixel).

### 2.2 Biểu diễn hình học 3D (CLO2 — Chương 4)

- Mesh: vertex, face, normal.  
- Các primitive: `BoxGeometry`, `SphereGeometry`, …  
- **Trong đồ án:** chỉ dùng hộp và cầu cho thí nghiệm (`src/components/geometries.js`).

### 2.3 Phép biến đổi affine (CLO3 — Chương 3)

| Phép | Ma trận / ý nghĩa | Triển khai trong đồ án |
|------|-------------------|-------------------------|
| **Tịnh tiến** | T(v) | TransformControls mode translate; lực W/A/S/D |
| **Quay** | R(θ) | TransformControls rotate; phím Q/E |
| **Tỉ lệ** | S(s) | TransformControls scale; Z/X; đồng bộ body shape |

- Ghi chú: biến đổi áp dụng lên **mesh** và đồng bộ **body** vật lý khi scale.

### 2.4 Phép chiếu phối cảnh (CLO3 — Chương 3)

- Công thức `PerspectiveCamera`: FOV, aspect, **near**, **far**.  
- Ảnh chụp GUI chỉnh FOV/near/far (`src/interaction/ui.js`).  
- Giải thích vùng nhìn thấy và clipping.

### 2.5 Texture mapping (CLO4 — Chương 3)

- UV coordinates, `TextureLoader`, `RepeatWrapping`, `repeat`.  
- **map** (diffuse) và **bumpMap** + `bumpScale`.  
- Tham chiếu Lab Texture: `23521825_Lab06/Texture/main.js`.

### 2.6 Mô hình chiếu sáng Phong (CLO4)

```
I = I_ambient + I_diffuse + I_specular
```

| Thành phần | Nguồn sáng trong đồ án |
|------------|-------------------------|
| Ambient | `AmbientLight` — `src/engine/view.js` |
| Diffuse + Specular | `MeshPhongMaterial` |
| Point | `PointLight` |
| Directional | `DirectionalLight` + castShadow |

- Tham chiếu Lab Chiếu sáng: `23521825_Lab06/Chiếu sáng/index.html`.

### 2.7 Shadow mapping (CLO4)

- Ý tưởng: depth map từ góc nhìn đèn → so sánh độ sâu pixel.  
- **PCFSoftShadowMap** — làm mềm mép bóng.  
- Cấu hình: `renderer.shadowMap`, `directionalLight.castShadow`.

### 2.8 Raycasting (tương tác)

- `THREE.Raycaster` chọn vật → highlight → panel lực.  
- File: `src/interaction/input.js`.

### 2.9 Vật lý cổ điển (phần ứng dụng — CLO5)

| Hiện tượng | Công thức | Cảnh |
|------------|-----------|------|
| Mặt phẳng nghiêng | a = g sinθ − μg cosθ | Cảnh 1 |
| Rơi tự do | s = ½gt² | Cảnh 2 |
| Lực ngang | F − f = ma, f = μN | Cảnh 3 |
| Va chạm | m₁v₁ + m₂v₂ = const, hệ số e | Cảnh 4 |

- Engine: `cannon-es`, bước cố định 1/60 (`src/engine/physics.js`).  
- Ghi nhận: mô phỏng **xấp xỉ** (sai số nhỏ so với mô hình điểm).

---

## CHƯƠNG 3 — PHÂN TÍCH YÊU CẦU (2–3 trang)

### 3.1 Yêu cầu đề đồ án ĐHMT (2.1.1)

| STT | Yêu cầu | Ưu tiên | Ghi chú triển khai |
|-----|---------|---------|---------------------|
| 1 | Khối hình cơ bản | Bắt buộc | Hộp, cầu (+ có thể demo thêm trong lab) |
| 2 | Chiếu phối cảnh near/far/FOV | Bắt buộc | lil-gui + PerspectiveCamera |
| 3 | Affine: tịnh tiến, quay, tỉ lệ | Bắt buộc | Chuột + bàn phím + TransformControls |
| 4 | Chiếu sáng + shadow map | Bắt buộc | Phong + PCFSoftShadowMap |
| 5 | Texture bitmap/preset | Bắt buộc | `textures.js` + upload |
| 6 | Animation | Bonus | Physics loop + auto animation |

### 3.2 Yêu cầu đề cương CS105

- CLO1 → Chương 1 báo cáo + vấn đáp.  
- CLO2–CLO4 → Chương 2 + demo từng chức năng.  
- CLO5 → 4 cảnh vật lý THCS.  
- Đồ án môn học (50% cuối kỳ): chương trình 5đ + báo cáo 3đ + slide 2đ.

### 3.3 Use case (bảng)

| Actor | Use case |
|-------|----------|
| Giáo viên | Chọn cảnh → chỉnh g, μ, θ → pause → chụp màn hình |
| Học sinh | Quan sát vector P,N,f,F_net → so sánh công thức HUD |
| Sinh viên (bảo vệ) | Demo đủ mục đồ họa + 1 cảnh vật lý |

*(Có thể vẽ 1 sơ đồ use case đơn giản)*

---

## CHƯƠNG 4 — THIẾT KẾ HỆ THỐNG (3–4 trang)

### 4.1 Kiến trúc tổng thể

```text
[index.html]  Sidebar + HUD + Viewport
      ↓
[src/main.js]  Game loop: input → physics → sync mesh → render
      ├── engine/view.js       (Scene, Camera, Lights, Renderer)
      ├── engine/physics.js    (CANNON.World)
      ├── engine/sceneManager.js (4 cảnh)
      ├── engine/surfaces.js   (μ mặt cảnh)
      ├── physics/forces.js    (F1,F2,F3, F_net)
      ├── analysis/metrics.js  (đo a, momentum)
      ├── interaction/input.js, ui.js, forceFrameControls.js
      └── components/          (geometries, visualizers, textures, graphCanvas)
```

**Hình bắt buộc:** Sơ đồ khối (có thể vẽ trong Word).

### 4.2 Luồng dữ liệu Physics ↔ Graphics

```text
Mỗi frame:
  1. applyCustomForces()  → body.applyForce
  2. world.step(1/60)
  3. mesh.position ← body.position
  4. mesh.quaternion ← body.quaternion
  5. renderer.render()
```

### 4.3 Thiết kế 4 cảnh

| Cảnh | File / hàm | Tham số cảnh | Vật preset |
|------|------------|--------------|------------|
| Mặt phẳng nghiêng | `initInclinedPlane` | g, μ dốc, θ | Dốc + 1–2 vật |
| Rơi tự do | `initFreeFall` | g | 2 khối lượng khác |
| Lực ngang | `initHorizontalForce` | μ sàn, F đẩy | 1 vật |
| Va chạm | `initCollision` | e | 2 vật 1D |

### 4.4 Thiết kế giao diện

- Sidebar: chọn cảnh, spawn, danh sách vật.  
- HUD dưới: vị trí, v, m, năng lượng, **công thức**.  
- Panel phải (lil-gui): camera, ánh sáng, vật liệu, lực F1–F3.  
- **Ảnh chụp:** toàn màn hình UI.

---

## CHƯƠNG 5 — CÀI ĐẶT VÀ TRIỂN KHAI (3–5 trang)

> Mỗi mục đồ án: **lý thuyết ngắn → file code → ảnh kết quả**.

### 5.1 Vẽ khối hình và load model

- `createBox`, `createSphere` — `geometries.js`  
- (Tuỳ chọn) `modelLoader.js` — GLB/OBJ  
- **Ảnh:** spawn hộp/cầu.

### 5.2 Chiếu phối cảnh

- `PerspectiveCamera` — `view.js`  
- Slider FOV, near, far — `ui.js`  
- **Ảnh:** trước/sau khi đổi FOV.

### 5.3 Biến đổi affine

- `TransformControls` — `input.js`  
- Phím G/R/T, W/A/S/D, Q/E, Z/X  
- **Ảnh:** gizmo tịnh tiến / quay / scale.

### 5.4 Chiếu sáng và bóng đổ

- 3 loại đèn — `view.js`  
- `MeshPhongMaterial` — `geometries.js`  
- **Ảnh:** so sánh bật/tắt shadow.

### 5.5 Texture mapping

- Preset + upload — `textures.js`, `main.js`  
- **Ảnh:** vật có texture gỗ/kim loại.

### 5.6 Mô phỏng vật lý và vector lực

- `forces.js`, `forceLabels.js`, `visualizers.js`  
- `forceFrameControls.js` — F1,F2,F3 vuông góc  
- **Ảnh:** mũi tên P, N, f, F_net trên vật chọn.

### 5.7 Đồ thị và metrics (nếu đã có)

- `graphCanvas.js`, `metrics.js` — v–t, so sánh a lý thuyết/đo.

### 5.8 Cấu trúc thư mục nộp bài

```text
MSSV.zip
├── Source/          (toàn bộ repo, kèm lib)
├── Release/
│   ├── index.html
│   ├── src/ ...
│   └── readme.txt   ← bắt buộc theo đề Đồ Án
└── Doc/
    └── BAO_CAO_MSSV.docx
```

---

## CHƯƠNG 6 — KẾT QUẢ THỰC NGHIỆM (3–4 trang)

### 6.1 Môi trường test

- OS, trình duyệt, độ phân giải, FPS trung bình.

### 6.2 Bảng kiểm thử chức năng đồ họa

| # | Chức năng | Kết quả | Ghi chú |
|---|-----------|---------|---------|
| 1 | Spawn hộp/cầu | Đạt / Không | |
| 2 | FOV, near, far | Đạt | |
| 3 | Translate / Rotate / Scale | Đạt | |
| 4 | Ambient + Point + Directional | Đạt | |
| 5 | Shadow mapping | Đạt | |
| 6 | Texture preset + upload | Đạt | |
| 7 | Raycasting chọn vật | Đạt | |

### 6.3 Bảng kiểm thử 4 cảnh vật lý

| Cảnh | Công thức | Quan sát | a hoặc s đo | Sai số ước lượng |
|------|-----------|----------|-------------|------------------|
| Dốc | a = g sinθ − μg cosθ | | | |
| Rơi tự do | s = ½gt² | | | |
| Lực ngang | F − f = ma | | | |
| Va chạm | Bảo toàn p | p trước = p sau? | | |

*(Điền số từ lần chạy thực tế khi bảo vệ)*

### 6.4 Lab 06 (bổ trợ thực hành)

| Lab | Nội dung | Kết quả |
|-----|----------|---------|
| Chiếu sáng | Lưới hộp + directional + shadow + GUI | [Ảnh] |
| Texture | Sàn Concrete + spotlights + bump | [Ảnh] |

---

## CHƯƠNG 7 — KẾT LUẬN (1–2 trang)

### 7.1 Kết quả đạt được

- Đã đáp ứng đề ĐHMT 2.1.1.1–2.1.1.5 + bonus animation.  
- Map đủ CLO2–CLO5 của CS105.  
- Ứng dụng được cho giờ dạy Vật lý THCS (4 cảnh).

### 7.2 Hạn chế

- Dùng Three.js thay vì WebGL thuần (lab dạy WebGL).  
- Không triển khai Ray Tracing CPU (chỉ rasterization + shadow map).  
- Sai số số học do bước 1/60 và xấp xỉ collision.

### 7.3 Hướng phát triển

- Export CSV dữ liệu thí nghiệm.  
- Nhiều ngôn ngữ / theme THCS.  
- VR hoặc mobile touch.

---

## CHƯƠNG 8 — TÀI LIỆU THAM KHẢO

1. Mai Tiến Dũng — Đề cương CS105 (2021).  
2. Đề đồ án ĐHMT — Gợi ý Đồ án 3D (UIT).  
3. Three.js Documentation — https://threejs.org/docs/  
4. cannon-es — https://github.com/pmndrs/cannon-es  
5. Fundamentals of Computer Graphics (Schroeder, …) — nếu có.  
6. Tài liệu lab UIT: WebGL, Rasterization (khóa thực hành).

---

## PHỤ LỤC A — HƯỚNG DẪN CHẠY (readme.txt cho Release)

```text
1. Cài Python 3 (hoặc bất kỳ static server).
2. Mở terminal tại thư mục Release.
3. Chạy: python -m http.server 5500
4. Trình duyệt: http://localhost:5500
5. Không mở trực tiếp file:// (texture và module sẽ lỗi).

Lab 06 (tùy chọn):
- Chiếu sáng: cd 23521825_Lab06/Chiếu sáng && python -m http.server 5501
- Texture: cd 23521825_Lab06/Texture && python -m http.server 5502
```

---

## PHỤ LỤC B — BẢNG MAPPING (in vào báo cáo hoặc slide)

| Đề ĐHMT | CLO | Chương CS105 | File chính |
|---------|-----|--------------|------------|
| 2.1.1.1 Khối hình | CLO2 | Ch.4 Geometry | `geometries.js` |
| 2.1.1.2 Chiếu phối cảnh | CLO3 | Ch.3 | `view.js`, `ui.js` |
| 2.1.1.3 Affine | CLO3 | Ch.3 | `input.js`, `geometries.js` |
| 2.1.1.4 Chiếu sáng + shadow | CLO4 | Ch.3,6 | `view.js` |
| 2.1.1.5 Texture | CLO4 | Ch.3 | `textures.js` |
| 2.1.1.6 Animation | CLO5 | — | `main.js`, `physics.js` |
| Gợi ý #7 Vật lý 3D | CLO5 | — | `sceneManager.js`, `forces.js` |

---

## PHỤ LỤC C — KỊCH BẢN SLIDE BẢO VỆ (10–12 slide, ~15 phút)

| Slide | Nội dung | Demo live |
|-------|----------|-----------|
| 1 | Tên đề tài, SV, GV | — |
| 2 | Vì sao chọn mô phỏng vật lý THCS | — |
| 3 | Kiến trúc hệ thống | Sơ đồ |
| 4 | **Đồ họa:** Khối hình + chiếu phối cảnh | Spawn + FOV |
| 5 | **Đồ họa:** Biến đổi affine | TransformControls |
| 6 | **Đồ họa:** Phong + shadow map | Tắt/bật shadow |
| 7 | **Đồ họa:** Texture | Đổi preset / upload |
| 8 | **Vật lý:** Cảnh dốc | Chỉnh θ, μ → HUD |
| 9 | **Vật lý:** Rơi tự do hoặc va chạm | Pause tại va chạm |
| 10 | Vector lực F1–F3 + F_net | Chọn vật, bảng số |
| 11 | Lab 06 (30 giây) | 2 ảnh Chiếu sáng + Texture |
| 12 | Kết luận + Q&A | — |

**Mẹo vấn đáp:** Luôn trả lời theo công thức **đồ họa trước**, **vật lý sau**. Ví dụ: “Em dùng shadow mapping trong pipeline rasterization, không phải ray tracing CPU như Chương 5 lý thuyết.”

---

## CHECKLIST TRƯỚC KHI NỘP

- [ ] `Source/` — code đầy đủ + thư viện  
- [ ] `Release/` — `index.html` chạy được + `readme.txt`  
- [ ] `Doc/` — file Word theo mục lục trên  
- [ ] Ảnh chụp màn hình mỗi mục 2.1.1.x trong báo cáo  
- [ ] Slide có demo + mapping CLO  
- [ ] Zip đúng tên `MSSV.zip`  
- [ ] Nộp courses.uit.edu.vn trước thi cuối kỳ  

---

*Tài liệu tạo tự động — chỉnh MSSV, tên, ảnh, số đo thực nghiệm trước khi nộp.*
