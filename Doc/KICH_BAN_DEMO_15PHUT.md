# Kịch bản demo bảo vệ ~15 phút (giáo viên THCS)

> Mở app: `python -m http.server 5500` → `http://localhost:5500`  
> Chuẩn bị: slide kiến trúc, ảnh Lab06, zip nộp bài.

---

## Phút 0–1 — Giới thiệu

- **Tên đề tài:** Sandbox mô phỏng vật lý 3D trên Web (CS105 + THCS).
- **Công nghệ:** Three.js (đồ họa 3D / WebGL) + cannon-es (vật lý).
- **Đối tượng:** Giáo viên / học sinh THCS — quan sát hiện tượng + đối chiếu công thức SGK.

---

## Phút 1–3 — Demo đồ họa (đề 2.1.1.1 → 2.1.1.5)

| Thao tác | Nói gì |
|----------|--------|
| Sidebar → spawn **Hộp, Cầu, Nón, Trụ, Bánh xe, Ấm trà** | “Đủ khối hình cơ bản theo đề ĐHMT + thêm Capsule, Nút xoắn, 12 mặt.” |
| Nút **📂 Model** → chọn file `.glb/.obj` | “Load model từ file — bounding sphere physics.” |
| Panel phải → **Phép chiếu** FOV / Near / Far | “Perspective projection — chỉnh vùng nhìn và clipping.” |
| Toolbar **G / R / T** + kéo gizmo | “Affine: tịnh tiến, quay, tỉ lệ bằng chuột.” |
| Phím **Q/E, Z/X** | “Biến đổi bằng bàn phím.” |
| Panel **Chiếu sáng** Ambient / Point / Directional | “Mô hình Phong: ambient + nguồn sáng điểm + định hướng.” |
| Quan sát bóng dưới vật | “Shadow mapping PCFSoftShadowMap.” |
| **Texture** preset + **🖼️ Texture** upload bitmap | “Texture mapping UV + ảnh tùy chọn.” |

---

## Phút 3–6 — Cảnh 1: Mặt phẳng nghiêng

1. Chọn card **Mặt phẳng nghiêng**.
2. Chọn vật trên dốc → xem HUD: `a_lt` (lý thuyết) vs `a_do` (đo).
3. Chỉnh **Góc doc θ** và **μ mặt** trên panel phải.
4. **Tạm dừng** (Space) tại lúc vật trượt — đọc bảng lực P, N, f, F_net.
5. Xem **đồ thị v–t** góc sidebar.

**Công thức nói:** `a = g·sinθ − μ·g·cosθ`

---

## Phút 6–9 — Cảnh 2: Rơi tự do (Galileo)

1. Chuyển **Rơi tự do**.
2. Chỉ **Reset** → quan sát **Cầu 1 kg** và **Hộp 4 kg** rơi cùng lúc.
3. HUD hiển thị `t`, `s` — nhấn mạnh: **khối lượng khác, rơi như nhau** (cùng g, bỏ qua sức cản không khí).

**Công thức:** `s = ½gt²`

---

## Phút 9–12 — Cảnh 3: Lực ngang & ma sát

1. Chọn **Lực ngang & ma sát**.
2. Chọn hộp → bật **F1**, chỉnh |F1| hoặc giữ **W** (lực nhanh).
3. Giảm μ → vật trượt; tăng μ → khó trượt.
4. Đọc bảng lực: khi `F ≤ f` đứng yên, khi `F > f` gia tốc.

**Công thức:** `F − f = ma`, `f = μN`

---

## Phút 12–14 — Cảnh 4: Va chạm

1. Chọn **Va chạm đàn hồi**.
2. **Reset** → 2 cầu lao vào nhau.
3. **Tạm dừng** ngay sau va chạm.
4. HUD: `p_truoc` và `p_sau` (kg·m/s) — giải thích **bảo toàn động lượng** (sai số nhỏ do mô phỏng).
5. Chỉnh **e va cham** trên panel → thấy nảy khác nhau.

**Công thức:** `m₁v₁ + m₂v₂ = const`

---

## Phút 14–15 — Kết + Lab06 + Q&A

- **Chụp ảnh** (📸) — minh họa slide.
- Nhắc nhanh Lab06: Chiếu sáng (lưới hộp + shadow) + Texture (sàn bê tông).
- Kết: đủ yêu cầu đồ họa 3D + ứng dụng mô phỏng vật lý THCS.

### Câu hỏi thường gặp

| Câu hỏi | Trả lời gợi ý |
|---------|----------------|
| Vì sao dùng Three.js không WebGL thuần? | Three.js là API cấp cao trên WebGL, vẫn đi qua GPU pipeline rasterization. |
| Shadow map vs Ray tracing? | Môn dạy RT lý thuyết; em dùng shadow map — thực tế trong game/engine realtime. |
| Sai số a đo vs lý thuyết? | Bước 1/60s, xấp xễ collision, ma sát một hệ số μ. |

---

*In file này kèm slide hoặc để trên bục khi demo.*
