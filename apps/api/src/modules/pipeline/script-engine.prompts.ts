/**
 * Script Engine Prompts — All AI prompts for the 12-step pipeline
 *
 * Ported from v1 script_generator.py full_pipeline_conversation().
 * Bilingual prompts (vi/en) for all non-Vietnamese languages.
 * Tách riêng để dễ maintain + iterate.
 */

// ═══════════════════════════════════════════════════════════════
// LANGUAGE CULTURE CONFIG — Culture-specific rules per language
// ═══════════════════════════════════════════════════════════════

export const LANGUAGE_CULTURE: Record<string, {
    writingSystem: string;
    idiomRule: string;
    culturalNotes: string;
    formality: string;
}> = {
    vi: {
        writingSystem: 'Sử dụng chính tả tiếng Việt chuẩn với đầy đủ dấu thanh (sắc, huyền, hỏi, ngã, nặng).',
        idiomRule: 'Dùng thành ngữ, tục ngữ tiếng Việt tự nhiên. KHÔNG dịch nguyên văn thành ngữ tiếng Anh.',
        culturalNotes: 'QUAN TRỌNG: CHỈ dùng từ ngữ PHỔ THÔNG (tiếng Việt chuẩn). TUYỆT ĐỐI KHÔNG dùng từ địa phương, phương ngữ vùng miền.',
        formality: 'Dùng giọng văn tự nhiên, gần gũi nhưng không suồng sã. Phù hợp cho video narration.',
    },
    en: {
        writingSystem: '',
        idiomRule: 'Use natural English idioms and expressions. Avoid awkward literal translations.',
        culturalNotes: 'Write for a global English-speaking audience with universally relatable examples.',
        formality: 'Use a conversational but professional tone.',
    },
    ja: {
        writingSystem: 'Use correct kanji (漢字), hiragana (ひらがな), and katakana (カタカナ) throughout.',
        idiomRule: 'Use natural Japanese expressions (慣用句/ことわざ). NEVER translate English idioms literally.',
        culturalNotes: 'Write with Japanese cultural sensitivity: respect hierarchy (上下関係), indirect communication style.',
        formality: 'Use です/ます form (丁寧語) by default for video narration.',
    },
    ko: {
        writingSystem: 'Use correct Korean spelling (맞춤법) and proper spacing (띄어쓰기). Use Hangul primarily.',
        idiomRule: 'Use natural Korean expressions (관용구/속담). NEVER translate English idioms literally.',
        culturalNotes: 'Write with Korean cultural sensitivity: respect age hierarchy (나이/서열), Confucian values.',
        formality: 'Use 합니다체 (formal polite) by default for video narration.',
    },
    zh: {
        writingSystem: 'Use simplified Chinese (简体中文) by default. Ensure correct character usage.',
        idiomRule: 'Use natural Chinese expressions (成语/俗语/歇后语). NEVER translate English idioms literally.',
        culturalNotes: 'Write with Chinese cultural sensitivity. Use examples familiar to Chinese-speaking viewers.',
        formality: 'Use a conversational yet respectful tone (口语化但不失礼貌).',
    },
    es: {
        writingSystem: 'Ensure correct use of Spanish accents (á, é, í, ó, ú), ñ, and inverted punctuation (¿ ¡).',
        idiomRule: 'Use natural Spanish expressions (refranes/modismos). NEVER translate English idioms literally.',
        culturalNotes: 'Write for a general Spanish-speaking audience. Use universally understood Spanish.',
        formality: 'Use tú (informal) by default for engaging video content.',
    },
    fr: {
        writingSystem: 'Ensure correct French accents (é, è, ê, ë, à, â, ù, û, ç, œ) and proper liaison rules.',
        idiomRule: 'Use natural French expressions. NEVER translate English idioms literally.',
        culturalNotes: 'Write for a general French-speaking audience. Maintain elegance and precision.',
        formality: 'Use vous (formal) by default for wider audience appeal.',
    },
    th: {
        writingSystem: 'Use correct Thai script (อักษรไทย) with proper tone marks and vowel placement.',
        idiomRule: 'Use natural Thai expressions (สำนวน/สุภาษิต). NEVER translate English idioms literally.',
        culturalNotes: 'Write with Thai cultural sensitivity: respect for elders and hierarchy, Buddhist values.',
        formality: 'Use polite language with appropriate particles (ครับ/ค่ะ).',
    },
    de: {
        writingSystem: 'Use correct German orthography with proper Umlauts (ä, ö, ü) and Eszett (ß).',
        idiomRule: 'Use natural German expressions (Redewendungen/Sprichwörter). NEVER translate English idioms literally.',
        culturalNotes: 'Write for a German-speaking audience (DACH region). Use culturally relevant examples.',
        formality: 'Use Sie (formal) by default for wider audience appeal.',
    },
    pt: {
        writingSystem: 'Use correct Portuguese orthography with proper accents (á, â, ã, à, é, ê, í, ó, ô, õ, ú, ç).',
        idiomRule: 'Use natural Portuguese expressions. NEVER translate English idioms literally.',
        culturalNotes: 'Write for a general Portuguese-speaking audience. Use universally understood Portuguese.',
        formality: 'Use você (informal polite) by default for engaging video content.',
    },
    ru: {
        writingSystem: 'Use correct Russian Cyrillic script (кириллица) with proper spelling and grammar.',
        idiomRule: 'Use natural Russian expressions (пословицы/поговорки/фразеологизмы). NEVER translate English idioms literally.',
        culturalNotes: 'Write for a Russian-speaking audience. Use culturally relevant examples.',
        formality: 'Use вы (formal) by default for video narration.',
    },
};

// ═══════════════════════════════════════════════════════════════
// LANGUAGE DEFAULTS — Narrative voice per language
// ═══════════════════════════════════════════════════════════════

export const LANG_NV_FIRST: Record<string, string> = {
    vi: 'tôi/mình', en: 'I/me', ja: '私/僕', ko: '나/저', zh: '我',
    es: 'yo', fr: 'je', th: 'ผม/ฉัน', de: 'ich', pt: 'eu', ru: 'я',
};
export const LANG_NV_SECOND: Record<string, string> = {
    vi: 'bạn', en: 'you', ja: 'あなた', ko: '당신', zh: '你',
    es: 'tú', fr: 'tu/vous', th: 'คุณ', de: 'du/Sie', pt: 'você', ru: 'ты/вы',
};
export const LANG_NV_THIRD: Record<string, string> = {
    vi: 'họ/người đó', en: 'they/the narrator', ja: '彼/彼女', ko: '그/그녀', zh: '他/她',
    es: 'él/ella', fr: 'il/elle', th: 'เขา/เธอ', de: 'er/sie', pt: 'ele/ela', ru: 'он/она',
};
export const LANG_AUDIENCE: Record<string, string> = {
    vi: 'bạn', en: 'you', ja: '皆さん', ko: '여러분', zh: '大家',
    es: 'tú', fr: 'vous', th: 'คุณ', de: 'Sie', pt: 'você', ru: 'вы',
};

export const LANG_NAMES: Record<string, string> = {
    en: 'English', vi: 'Vietnamese', ja: 'Japanese', ko: 'Korean',
    zh: 'Chinese', es: 'Spanish', fr: 'French', th: 'Thai',
    de: 'German', pt: 'Portuguese', ru: 'Russian',
};

export const STORYTELLING_STYLES: Record<string, { en: string; vi: string }> = {
    immersive: { en: 'IMMERSIVE/ROLE-PLAYING', vi: 'NHẬP VAI' },
    documentary: { en: 'DOCUMENTARY', vi: 'THUYẾT MINH' },
    conversational: { en: 'CONVERSATIONAL', vi: 'ĐỐI THOẠI' },
    analytical: { en: 'ANALYTICAL', vi: 'PHÂN TÍCH' },
    narrative: { en: 'NARRATIVE/STORYTELLING', vi: 'KỂ CHUYỆN' },
};

// ═══════════════════════════════════════════════════════════════
// STEP PROMPTS — Bilingual templates
// ═══════════════════════════════════════════════════════════════

/** Step 2: Translation prompt */
export function buildTranslatePrompt(
    srcName: string, outName: string, script: string,
): string {
    return `You are a professional translator. Translate the following script from ${srcName} to ${outName}.

Rules:
- Preserve the STRUCTURE (paragraphs, line breaks, sections) exactly.
- Prioritize NATURAL, fluent ${outName} over rigid literal translation.
- Adapt idioms and cultural references to feel natural in ${outName}.
- Keep proper nouns, brand names, and technical terms unchanged.
- Do NOT add commentary, notes, or explanations. Output ONLY the translated text.

--- SCRIPT TO TRANSLATE ---
${script}
--- END ---

Translated ${outName} script:`;
}

/** Step 3: Clean script (remove CTA, channel names) */
export function buildCleanPrompt(
    langName: string, script: string, useEn: boolean,
): string {
    if (useEn) {
        return `I will give you a script in ${langName}. Please REMOVE the following elements and return ONLY the cleaned script:

1. ❌ Remove ALL channel name mentions (e.g. "This is [channel name]", "Welcome to [channel name]")
2. ❌ Remove ALL CTA (Call to Action) content: subscribe, like, share, bell notifications
3. ❌ Remove ALL product/book/course recommendations and purchase links
4. ❌ Remove ALL brand introductions of the original channel

KEEP everything else: the story, analysis, insights, lessons, emotions.

ORIGINAL SCRIPT:
${script}

Return ONLY the cleaned script in ${langName} with no explanations.`;
    }
    return `Tôi sẽ đưa bạn một kịch bản. Hãy LOẠI BỎ các yếu tố sau và trả về CHỈ kịch bản đã làm sạch:

1. ❌ Xóa TẤT CẢ đề cập tên kênh
2. ❌ Xóa TẤT CẢ CTA (kêu gọi hành động): đăng ký, like, share, bật chuông
3. ❌ Xóa TẤT CẢ giới thiệu/quảng bá sản phẩm, sách, khóa học, link mua hàng
4. ❌ Xóa TẤT CẢ phần giới thiệu thương hiệu/kênh gốc

GIỮ LẠI tất cả phần còn lại: câu chuyện, phân tích, insight, bài học, cảm xúc.

KỊCH BẢN GỐC:
${script}

Trả về CHỈ kịch bản đã làm sạch, không giải thích.`;
}

/** Step 4: Memorize chunk */
export function buildMemorizePrompt(
    idx: number, total: number, chunk: string, useEn: boolean,
): string {
    if (useEn) {
        return `Please learn and memorize the following content (Part ${idx}/${total}):

${chunk}

Read carefully and memorize. Reply only "Memorized part ${idx}".`;
    }
    return `Hãy học và ghi nhớ đoạn sau (Phần ${idx}/${total}):

${chunk}

Đọc kỹ và ghi nhớ. Chỉ trả lời "Đã ghi nhớ phần ${idx}".`;
}

/** Step 5: Extract main ideas + characters + metaphors + perspective */
export function buildStep5Prompt(useEn: boolean): string {
    if (useEn) {
        return `From the memorized script, extract the MAIN IDEAS, analyze the CHARACTERS, identify METAPHORS, and analyze the NARRATIVE PERSPECTIVE.

⚠️ RULES:
- List 3-7 key topics/ideas the script covers
- Each idea should be a SHORT, GENERALIZED summary (1 line)
- DO NOT copy exact sentences from the script
- DO NOT include writing style, tone, or voice analysis (those are already in StyleA DNA)
- Focus ONLY on WHAT the script is about, not HOW it's written
- List ALL characters/people mentioned in the script
- For each character: name, type (real_person if they exist in real life, fictional otherwise), role, relationships, addressing
- Extract all metaphorical imagery, symbolic expressions, indirect references
- Analyze the narrative perspective: who is telling the story? From which point of view?

Return JSON:
{"main_ideas": ["idea 1", "idea 2"], "characters": [{"name": "Character Name", "type": "real_person or fictional", "role": "protagonist / main character", "relationships": "relationship with other characters", "addressing": "how this character addresses others"}], "metaphors": [{"expression": "the metaphorical phrase", "meaning": "what it actually refers to"}], "original_perspective": {"type": "first_person / second_person / third_person / mixed", "narrator_character": "name of character narrating (if first_person)", "has_nested_narration": false, "nested_detail": "", "description": "brief description of how the story is told"}}

Return ONLY JSON.`;
    }
    return `Từ kịch bản đã ghi nhớ, trích xuất các Ý CHÍNH, phân tích NHÂN VẬT, nhận diện HÌNH ẢNH ẨN DỤ, và phân tích GÓC KỂ.

⚠️ QUY TẮC:
- Liệt kê 3-7 ý chính/chủ đề mà kịch bản đề cập
- Mỗi ý là TÓM TẮT NGẮN GỌN, TỔNG QUÁT (1 dòng)
- KHÔNG sao chép nguyên câu từ kịch bản
- CHỈ tập trung vào NỘI DUNG kịch bản nói về cái gì
- Liệt kê TẤT CẢ nhân vật/người được nhắc đến
- Trích xuất tất cả các hình ảnh ẩn dụ, biểu tượng
- Phân tích góc kể: ai đang kể câu chuyện?

Trả về JSON:
{"main_ideas": ["ý chính 1"], "characters": [{"name": "Tên", "type": "real_person hoặc fictional", "role": "vai trò", "relationships": "mối quan hệ", "addressing": "cách xưng hô"}], "metaphors": [{"expression": "cụm từ ẩn dụ", "meaning": "ý nghĩa thực sự"}], "original_perspective": {"type": "first_person / second_person / third_person / mixed", "narrator_character": "", "has_nested_narration": false, "nested_detail": "", "description": "mô tả ngắn"}}

Chỉ trả về JSON.`;
}

/** Step 8: Outline prompt */
export function buildOutlinePrompt(
    langName: string, targetWordCount: number, useEn: boolean,
): string {
    if (useEn) {
        return `Based on the memorized Style A and original script content, create an Outline for the new script in ${langName}.
Max 5 sections. Target ${targetWordCount} words.
Follow the natural structure learned from StyleA DNA — do NOT force any rigid formula.

Return JSON:
{"sections": [{"id": "section_1", "title": "", "description": "", "word_count_target": 0, "key_points": [], "special_instructions": ""}]}

Return ONLY JSON.`;
    }
    return `Dựa trên Giọng văn A và nội dung kịch bản gốc đã ghi nhớ, tạo Dàn ý cho kịch bản mới bằng ${langName}.
Tối đa 5 phần. Mục tiêu ${targetWordCount} từ.
Theo cấu trúc tự nhiên đã học từ StyleA DNA — KHÔNG áp dụng công thức cứng.

Trả về JSON:
{"sections": [{"id": "section_1", "title": "", "description": "", "word_count_target": 0, "key_points": [], "special_instructions": ""}]}

Chỉ trả về JSON.`;
}

/** Step 9: Draft prompt */
export function buildDraftPrompt(
    langName: string, numSections: number, targetWordCount: number, useEn: boolean,
): string {
    if (useEn) {
        return `Using Style A and Outline A, write the FULL DRAFT content.

Rules:
- Write content SIMILAR to the original script while adding NEW useful value for the listener
- APPLY Style A throughout — voice, storytelling, hooks, emotion, signature phrases, unique patterns, narrative perspective
- Follow the outline structure: ${numSections} section(s), total ~${targetWordCount} words in ${langName}
- Write continuously — do NOT split into labeled sections or use headers
- No icons. No canvas. Write ONLY in ${langName}.

Write the complete draft now:`;
    }
    return `Dựa trên Giọng văn A và Dàn ý A, hãy bắt đầu viết nội dung mới.

Quy tắc:
- Viết nội dung TƯƠNG ĐỒNG với kịch bản gốc và tạo thêm giá trị mới
- ÁP DỤNG Giọng văn A xuyên suốt
- Viết theo cấu trúc dàn ý: ${numSections} phần, tổng ~${targetWordCount} từ bằng ${langName}
- Viết liền mạch — KHÔNG chia thành các phần có tiêu đề, KHÔNG đánh số
- Không icon. Tắt canvas. CHỈ viết bằng ${langName}.

Bắt đầu viết nháp toàn bộ:`;
}

/** Step 10: Section refinement (opening, middle, closing) */
export function buildSectionPrompt(p: {
    sectionNum: number;
    sectionTitle: string;
    totalSections: number;
    wordsPerSection: number;
    langName: string;
    channelName: string;
    useEn: boolean;
    isFirst: boolean;
    isLast: boolean;
    quizInstr: string;
    valueInstr: string;
}): string {
    if (p.isFirst) return buildOpeningPrompt(p);
    if (p.isLast) return buildClosingPrompt(p);
    return buildMiddlePrompt(p);
}

function buildOpeningPrompt(p: {
    sectionNum: number; sectionTitle: string; wordsPerSection: number;
    langName: string; channelName: string; useEn: boolean; quizInstr: string;
}): string {
    if (p.useEn) {
        const greeting = p.channelName
            ? `- Include greeting: "This is ${p.channelName}"\n- After hook, call for subscribe`
            : '- NO channel greeting, NO subscribe/like/share calls';
        return `Using Style A, rewrite SECTION ${p.sectionNum} ("${p.sectionTitle}") following Outline A, with more depth and substance.

- Write coherently and with EMOTION. Write continuously, no sub-sections, no icons.
- This is the OPENING — create CURIOSITY, MYSTERY, ATTRACTION, a STRONG emotional shock from the very first line to HOOK into the viewer's mind.
${greeting}${p.quizInstr}
- Write in ${p.langName} with ~${p.wordsPerSection} words.
- No canvas.

Write section ${p.sectionNum} ONLY:`;
    }
    const greetingVi = p.channelName
        ? `- Chèn lời chào: "Đây là ${p.channelName}"\n- Sau hook, kêu gọi đăng ký kênh`
        : '- KHÔNG chào tên kênh, KHÔNG nhắc subscribe/like/share';
    return `Dùng Giọng văn A, hãy viết lại phần thứ ${p.sectionNum} ("${p.sectionTitle}") bám sát dàn ý A và viết sâu sắc hơn.

- Hãy viết mạch lạc và có cảm xúc. Viết bài xuyên suốt, không chia từng phần, không dùng icon.
- Vì đây là đoạn mở bài nên cần gây tò mò, bí ẩn, thu hút, sốc ngay từ ban đầu để HOOK vào tâm trí khán giả.
${greetingVi}${p.quizInstr}
- Viết bằng ${p.langName} với ~${p.wordsPerSection} từ.
- Tắt canvas.

Chỉ viết phần ${p.sectionNum}:`;
}

function buildClosingPrompt(p: {
    sectionNum: number; sectionTitle: string; wordsPerSection: number;
    langName: string; channelName: string; useEn: boolean; valueInstr: string;
}): string {
    if (p.useEn) {
        const cta = p.channelName
            ? `- Use CTA approach from Style A\n- Include subscribe to ${p.channelName}${p.valueInstr}`
            : `- Provide a natural, thoughtful conclusion${p.valueInstr}\n- NO subscribe, like, share`;
        return `Using Style A, rewrite SECTION ${p.sectionNum} ("${p.sectionTitle}") — the CLOSING — following Outline A, with more depth.

- Use 1 sentence to smoothly transition from the previous section.
- Write coherently and with EMOTION. No sub-sections, no icons.
- Provide depth — a real lesson or insight the viewer takes away.
${cta}
- Write in ${p.langName} with ~${p.wordsPerSection} words.
- No canvas.

Write section ${p.sectionNum} ONLY:`;
    }
    const ctaVi = p.channelName
        ? `- Dùng cách CTA từ Giọng văn A\n- Kêu gọi đăng ký kênh ${p.channelName}${p.valueInstr}`
        : `- Đưa ra kết luận tự nhiên, sâu sắc${p.valueInstr}\n- KHÔNG nhắc subscribe, like, share`;
    return `Dùng Giọng văn A, hãy viết lại phần thứ ${p.sectionNum} ("${p.sectionTitle}") — phần KẾT — bám sát dàn ý A.

- Dùng 1 câu kết nối mượt mà với phần trước.
- Viết mạch lạc và có cảm xúc. Không chia từng phần, không icon.
- Đưa ra bài học sâu sắc, điều người xem thực sự mang đi được.
${ctaVi}
- Viết bằng ${p.langName} với ~${p.wordsPerSection} từ.
- Tắt canvas.

Chỉ viết phần ${p.sectionNum}:`;
}

function buildMiddlePrompt(p: {
    sectionNum: number; sectionTitle: string; wordsPerSection: number;
    langName: string; useEn: boolean;
}): string {
    if (p.useEn) {
        return `Using Style A, rewrite SECTION ${p.sectionNum} ("${p.sectionTitle}") following Outline A, with more depth.

- Use 1 sentence to smoothly transition from the previous section.
- Write coherently and with EMOTION. No sub-sections, no icons.
- Do NOT repeat content from previous sections.
- Write in ${p.langName} with ~${p.wordsPerSection} words.
- No canvas.

No subscribe, like, share, quiz, or channel promotion.

Write section ${p.sectionNum} ONLY:`;
    }
    return `Dùng Giọng văn A, hãy viết lại phần thứ ${p.sectionNum} ("${p.sectionTitle}") bám sát dàn ý A và viết sâu sắc hơn.

- Dùng 1 câu kết nối mượt mà với phần trước.
- Viết mạch lạc và có cảm xúc. Không chia từng phần, không icon.
- Không viết lặp lại nội dung của các phần trước.
- Viết bằng ${p.langName} với ~${p.wordsPerSection} từ.
- Tắt canvas.

Không nhắc subscribe, like, share, quiz, quảng bá kênh.

Chỉ viết phần ${p.sectionNum}:`;
}

/** Step 11: Auto-continue */
export function buildAutoContinuePrompt(
    neededWords: number, useEn: boolean,
): string {
    return useEn
        ? `Continue with ~${neededWords} words. Keep style. NO new CTAs.`
        : `Viết tiếp ~${neededWords} từ. Giữ phong cách. KHÔNG thêm CTA. Tắt canvas.`;
}

/** Step 12: Quality review */
export function buildQualityReviewPrompt(
    resolvedNarrativeVoice: string,
    resolvedAudienceAddress: string,
    country: string,
    langName: string,
    useEn: boolean,
): string {
    if (useEn) {
        const countryCheck = country ? `\n6. Does the content violate ${country} law?` : '';
        const audienceCheck = resolvedAudienceAddress
            ? `Audience address "${resolvedAudienceAddress}" consistent?`
            : 'Audience address natural and consistent?';
        return `QUALITY REVIEW:
Review the ENTIRE script you just wrote. Check for these issues:

CHECKLIST:
1. Is the content too SIMILAR to the original script? (paraphrased copies = BAD)
2. Any REPETITIVE content? (same idea repeated in different sections)
3. YouTube compliance? (no hate speech, misinformation, harmful content)
4. Narrator "${resolvedNarrativeVoice}" CONSISTENT throughout?
5. ${audienceCheck}${countryCheck}
7. Any technical jargon or foreign terms leaked?
8. Character names and addressing consistent?

RESPONSE FORMAT:
- If ALL checks pass: return exactly "NO_ISSUES_FOUND"
- If ANY issue found: return JSON with ONLY the parts that need fixing:
{"issues": [{"original": "exact text from the script", "fixed": "corrected replacement text"}]}

RULES:
- "original" must be an EXACT substring from the script
- Only include parts that actually need fixing
- Write fixes ONLY in ${langName}. No icons.`;
    }
    const countryCheck = country ? `\n6. Nội dung có vi phạm pháp luật ${country}?` : '';
    const audienceCheck = resolvedAudienceAddress
        ? `Xưng hô "${resolvedAudienceAddress}" nhất quán?`
        : 'Xưng hô tự nhiên và nhất quán?';
    return `KIỂM TRA CHẤT LƯỢNG:
Kiểm tra TOÀN BỘ kịch bản vừa viết.

DANH SÁCH KIỂM TRA:
1. Nội dung có QUÁ GIỐNG kịch bản gốc?
2. Có nội dung LẶP LẠI?
3. Tuân thủ YouTube?
4. Ngôi kể "${resolvedNarrativeVoice}" NHẤT QUÁN xuyên suốt?
5. ${audienceCheck}${countryCheck}
7. Có thuật ngữ kỹ thuật hoặc từ ngữ nước ngoài lọt vào?
8. Tên nhân vật và xưng hô nhất quán?

ĐỊNH DẠNG TRẢ LỜI:
- Nếu TẤT CẢ đều OK: trả về chính xác "NO_ISSUES_FOUND"
- Nếu PHÁT HIỆN lỗi: trả về JSON:
{"issues": [{"original": "đoạn văn chính xác bị lỗi", "fixed": "đoạn văn đã sửa"}]}

QUY TẮC:
- "original" phải là chuỗi CHÍNH XÁC từ kịch bản
- Chỉ liệt kê phần CẦN SỬA
- Viết sửa CHỈ bằng ${langName}. Không icon.`;
}
