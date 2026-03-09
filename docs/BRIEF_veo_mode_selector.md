# 💡 BRIEF: VEO Mode Selector (Project Settings)

**Ngày tạo:** 2026-03-09
**Mức độ:** 🟢 Đơn giản (chỉ sửa 1 file frontend)

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
- Pipeline 13-step đã hoạt động, backend đọc `veoMode` từ `projectSettings`
- Nhưng KHÔNG CÓ UI để user chọn VEO mode → luôn default `"scenebuilder"`
- User không thể thay đổi mode visual AI cho project của mình

## 2. GIẢI PHÁP
Thêm card **"Cài đặt Video AI"** vào form Project Settings (`project-settings.tsx`) với:
- **VEO Mode** selector (4 modes)
- **Image Prompt Mode** selector (3 modes)  
- **Visual Theme** input (text mô tả phong cách visual)
- **Main Character** description
- **Environment Description**

## 3. SCOPE

### 🚀 Cần làm (1 file):
- [x] `apps/web/src/components/forms/project-settings.tsx`
  - Thêm Card "Cài đặt Video AI" 
  - VEO Mode: Select dropdown (4 options + mô tả)
  - Image Prompt Mode: Select dropdown (3 options)
  - Visual Theme: Input text
  - Main Character: Textarea
  - Environment Description: Textarea
  - Cập nhật `ProjectSettings` interface

### ❌ KHÔNG cần sửa:
- Backend: Đã đọc `projectSettings.veoMode` sẵn rồi
- `pipeline.constants.ts`: Đã có `VEO_MODES` và `IMAGE_PROMPT_MODES`
- `create-production.tsx`: Không cần override per-video (Phase 2)
- Database: `globalSettings` là JSON field, không cần migration

## 4. VEO MODES (từ pipeline.constants.ts)

| Value | Label | Mô tả UX |
|-------|-------|-----------|
| `text_to_video` | 🎬 Text to Video | AI tạo video hoàn toàn từ mô tả văn bản |
| `ingredients_to_video` | 🧩 Ingredients to Video | Kết hợp ảnh + text để tạo video |
| `first_last_frame` | 🖼️ First & Last Frame | Chỉ định frame đầu/cuối, AI tạo video giữa |
| `scenebuilder` | 🎨 Scene Builder (Mặc định) | AI xây dựng từng scene chi tiết với nhân vật + bối cảnh |

## 5. IMAGE PROMPT MODES

| Value | Label | Mô tả |
|-------|-------|-------|
| `reference` | 📸 Reference | Tạo ảnh tham chiếu cho nhân vật/bối cảnh |
| `scene_builder` | 🏗️ Scene Builder | Xây dựng scene từ entities |
| `concept` | 💡 Concept Art | Tạo concept art cho visual |

## 6. BƯỚC TIẾP THEO
→ `/code` để implement
