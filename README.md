# CS105 — Sandbox mô phỏng vật lý 3D (THCS)

Đồ án môn Đồ hoạ máy tính (CS105) — UIT.  
**Mô phỏng cơ học cổ điển** cho học sinh / giáo viên THCS, dùng **Three.js** + **cannon-es**.

> Định hướng chi tiết: xem [PLAN.md](PLAN.md) (source of truth).

## Chạy dự án

```bash
cd CS105-Project
python -m http.server 5500
```

Mở: `http://localhost:5500`

## Cho lớp THCS

### 4 cảnh mô phỏng

1. **Mặt phẳng nghiêng** — `a = g sinθ − μg cosθ`, so sánh a lý thuyết / đo, đồ thị v–t  
2. **Rơi tự do** — `s = ½gt²`, Galileo (2 khối lượng khác nhau)  
3. **Lực ngang & ma sát** — `F − f = ma`, μ trên mặt sàn  
4. **Va chạm** — 2 vật 1 chiều, bảo toàn động lượng, hệ số e  

### Đối tượng

- Thí nghiệm: **hộp**, **cầu** (spawn tối đa 3 vật thêm / cảnh)  
- Mặt cảnh: sàn, dốc — **μ chỉ trên mặt**, không trên vật  

### Lực (tối đa 3 vector tùy chỉnh)

- F1, F2, F3: bật/tắt, chỉnh Fx/Fy/Fz (panel phải) hoặc W/A/S/D → F1  
- Hiển thị P, N, f, F_net + bảng số (N)  
- Vật chuyển động theo **tổng hợp lực** (engine + lực gắn)  

### Điều khiển

| Phím / Nút | Chức năng |
|------------|----------|
| Space / Tạm dừng | Pause simulation |
| N / Bước | Một bước physics |
| P / Reset | Khôi phục vị trí ban đầu cảnh |
| W A S D | Đặt F1 (lực ngang) |
| ? | Phím tắt |

## Mapping CS105 (báo cáo)

| Khái niệm | Triển khai |
|-----------|------------|
| Transformation | Affine: translate, rotate, scale (TransformControls) |
| Projection | PerspectiveCamera — FOV, near, far |
| Lighting | MeshPhongMaterial + ambient / point / directional |
| Shadow | DirectionalLight + PCFSoftShadowMap |
| Texture | UV + preset |
| Raycasting | Chọn vật |
| Physics | cannon-es — F_net, μ mặt, e va chạm |

## Cấu trúc mã

```
src/
  main.js              # Vòng lặp, HUD, pause
  state.js             # Trạng thái toàn cục
  engine/              # physics, view, sceneManager, surfaces
  physics/forces.js    # 3 lực tùy chỉnh, F_net
  analysis/metrics.js  # Đo a, momentum, s, t
  components/          # geometries, visualizers, graphCanvas
  interaction/         # input, ui
```

## Agent / phát triển tiếp

Đọc [PLAN.md](PLAN.md) và [AGENTS.md](AGENTS.md) trước khi sửa code. Rule Cursor: `.cursor/rules/plan-first.mdc`.
