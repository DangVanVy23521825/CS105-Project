# Huong dan cho Agent (CS105 Physics)

**Nguon su that:** [PLAN.md](PLAN.md) — doc file nay truoc moi thay doi code.

## Tom tat du an

- Sandbox mo phong co hoc 3D cho hoc sinh / giao vien THCS (Viet Nam).
- **4 canh:** Mat phang nghieng, Roi tu do, Luc ngang & ma sat, Va cham.
- **2 hinh thi nghiem:** Hop (box), Cau (sphere). Mu chi tren **mat canh** (san, doc).
- **3 luc tuy chinh** F1–F3 tren vat (bat/tat, 3D, N); khong tinh P va f.
- Moi truong: chi **day**. Spawn user: toi da **3** vat dong / canh.

## Kien truc chinh

- `src/main.js` — vong lap, HUD, luc, pause
- `src/engine/sceneManager.js` — 4 canh preset
- `src/engine/physics.js` + `surfaces.js` — cannon-es, ContactMaterial theo mat
- `src/physics/forces.js` — customForces, F_net
- `src/interaction/ui.js` — lil-gui tham so canh + luc

Khong sua file ke hoach `.cursor/plans/*.plan.md` tru khi user yeu cau.
