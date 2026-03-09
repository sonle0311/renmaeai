# Phase 04: Frontend UI Updates
Status: ⬜ Pending
Dependencies: Phase 01 (shared types/constants)

## Objective
Cập nhật frontend để hiển thị 13 steps, thêm VEO/Image mode selectors,
và visual context inputs vào form tạo production.

## Implementation Steps

### 1. Update `progress.tsx` — 13 step icons + labels
File: `apps/web/src/components/productions/progress.tsx`

```typescript
import { Brain, Clapperboard, Users, Image, LayoutGrid, BarChart3 } from "lucide-react";

const STEP_ICONS: Record<number, React.ReactNode> = {
    1: <Youtube className="h-4 w-4" />,      // Lấy nội dung
    2: <Palette className="h-4 w-4" />,       // Phân tích phong cách
    3: <FileText className="h-4 w-4" />,      // Viết script
    4: <Scissors className="h-4 w-4" />,      // Chia cảnh
    5: <Brain className="h-4 w-4" />,         // AI Director (NEW)
    6: <Mic className="h-4 w-4" />,           // TTS
    7: <Clapperboard className="h-4 w-4" />,  // Video Direction (NEW)
    8: <Video className="h-4 w-4" />,         // VEO Prompts
    9: <Users className="h-4 w-4" />,         // Entity Extraction (NEW)
    10: <Image className="h-4 w-4" />,        // Reference Prompts (NEW)
    11: <LayoutGrid className="h-4 w-4" />,   // Scene Builder (NEW)
    12: <BarChart3 className="h-4 w-4" />,    // Metadata SEO (NEW)
    13: <CheckCircle className="h-4 w-4" />,  // Hoàn tất
};

const STEP_LABELS: Record<number, string> = {
    1: "Lấy nội dung",
    2: "Phân tích phong cách",
    3: "Viết script AI",
    4: "Chia cảnh",
    5: "AI Director",
    6: "Giọng đọc TTS",
    7: "Phân tích đạo diễn",
    8: "Tạo prompt video",
    9: "Trích xuất nhân vật",
    10: "Prompt ảnh reference",
    11: "Prompt scene builder",
    12: "Metadata & SEO",
    13: "Hoàn tất",
};
```

### 2. Update `StepOutputRenderer` — thêm cases 5, 7-12
For each new step, render relevant output:

```typescript
case 5: // AI Director
    return <Badge>Genre: {output.genre}</Badge>;
case 7: // Direction
    return <span>{output.directionCount} cảnh đã phân tích</span>;
case 9: // Entities
    return <span>{output.entityCount} nhân vật/bối cảnh</span>;
case 10: // Reference
    return <span>{output.referencePromptCount} prompts</span>;
case 11: // Scene Builder
    return <span>{output.sceneBuilderCount} scene prompts</span>;
case 12: // Metadata
    return <span>SEO ready</span>;
```

### 3. Update `create-production.tsx` — Add mode selectors
File: `apps/web/src/components/forms/create-production.tsx`

**Add VEO Mode Selector:**
```tsx
<Select value={veoMode} onValueChange={setVeoMode}>
    <SelectTrigger><SelectValue placeholder="VEO Mode" /></SelectTrigger>
    <SelectContent>
        <SelectItem value="text_to_video">Text-to-Video (chuẩn)</SelectItem>
        <SelectItem value="ingredients_to_video">Ingredients-to-Video (I2V)</SelectItem>
        <SelectItem value="first_last_frame">First & Last Frame (F&LF)</SelectItem>
        <SelectItem value="scenebuilder">Scenebuilder</SelectItem>
    </SelectContent>
</Select>
```

**Add Image Prompt Mode Selector:**
```tsx
<Select value={imagePromptMode} onValueChange={setImagePromptMode}>
    <SelectTrigger><SelectValue placeholder="Image Mode" /></SelectTrigger>
    <SelectContent>
        <SelectItem value="reference">Reference (Character sheets)</SelectItem>
        <SelectItem value="scene_builder">Scene Builder (Scene images)</SelectItem>
        <SelectItem value="concept">Concept Art</SelectItem>
    </SelectContent>
</Select>
```

**Add Visual Context Fields:**
```tsx
<div className="space-y-3">
    <Label>Nhân vật chính</Label>
    <Textarea placeholder="VD: Cô gái trẻ tóc dài đen, áo dài trắng..." />
    
    <Label>Bối cảnh / Môi trường</Label>
    <Textarea placeholder="VD: Phố cổ Hà Nội mùa thu, nắng vàng..." />
    
    <Label>Phong cách hình ảnh</Label>
    <Textarea placeholder="VD: Cinematic, warm tones, 35mm film look..." />
</div>
```

### 4. Update `use-pipeline-socket.ts` — handle 13 steps
File: `apps/web/src/hooks/use-pipeline-socket.ts`

- Update step count from 7 to 13
- Add handlers for new step output events
- Update progress calculation (each step = ~7.7% instead of ~14.3%)

### 5. Step grouping UI (optional enhancement)
Group 13 steps visually into 4 phases for clarity:

```tsx
const PHASE_GROUPS = [
    { label: "📥 Chuẩn bị", steps: [1, 2, 3, 4, 5] },
    { label: "🗣️ Audio", steps: [6] },
    { label: "🎬 Visual", steps: [7, 8, 9, 10, 11] },
    { label: "📦 Hoàn tất", steps: [12, 13] },
];
```

## Files to Modify
| File | Changes |
|------|---------|
| `progress.tsx` | 13 icons, 13 labels, 8 new StepOutputRenderer cases |
| `create-production.tsx` | VEO mode selector, Image mode selector, Visual context fields |
| `use-pipeline-socket.ts` | Handle 13 steps, new output events |

## Test Criteria
- [ ] Progress UI shows all 13 steps
- [ ] Each step has correct icon and label
- [ ] VEO mode selector sends correct value to API
- [ ] Image prompt mode selector works
- [ ] Visual context fields are included in production creation request
- [ ] Socket events for new steps update UI correctly
- [ ] Step grouping makes the flow visually clear

---
Next Phase: `phase-05-integration.md`
