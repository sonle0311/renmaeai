/**
 * Script Engine Service — 12-Step Conversation-Based Pipeline
 *
 * Port from v1 AdvancedRemakeWorkflow.full_pipeline_conversation()
 * Architecture V2: Uses BYOK AiClientService, no shared keys.
 *
 * 2 Conversations:
 *   Conv 1 (Analysis): Steps 1-6
 *   Conv 2 (Writing):  Steps 7-12
 */

import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../ai/ai-client.service';
import type { UserAISettings } from '../ai/ai-client.types';
import type {
    ScriptPipelineInput,
    ScriptPipelineOutput,
    OutlineSection,
    DraftSection,
} from './script-engine.types';
import {
    LANGUAGE_CULTURE,
    LANG_NAMES,
    LANG_NV_FIRST,
    LANG_NV_SECOND,
    LANG_NV_THIRD,
    STORYTELLING_STYLES,
    buildTranslatePrompt,
    buildCleanPrompt,
    buildMemorizePrompt,
    buildStep5Prompt,
    buildOutlinePrompt,
    buildDraftPrompt,
    buildSectionPrompt,
    buildAutoContinuePrompt,
    buildQualityReviewPrompt,
} from './script-engine.prompts';

const CHUNK_SIZE = 6000;

export type ProgressCallback = (
    step: string,
    percentage: number,
    message: string,
) => void;

@Injectable()
export class ScriptEngineService {
    private readonly logger = new Logger(ScriptEngineService.name);

    constructor(private readonly aiClient: AiClientService) { }

    /**
     * Run the full 12-step script generation pipeline.
     * Uses 2 AI conversations for context continuity.
     */
    async runPipeline(
        settings: UserAISettings,
        input: ScriptPipelineInput,
        onProgress?: ProgressCallback,
    ): Promise<ScriptPipelineOutput> {
        const results: Record<string, unknown> = {};
        let conv1Id: string | null = null;
        let conv2Id: string | null = null;

        const lang = input.language;
        const useEn = lang !== 'vi';
        const langName = LANG_NAMES[lang] || 'English';

        // Resolve narrative voice
        const resolvedNarrativeVoice = this.resolveNarrativeVoice(input);
        const resolvedAudienceAddress = this.resolveAudienceAddress(input);

        const progress = (step: string, pct: number, msg: string) => {
            if (onProgress) {
                try { onProgress(step, pct, msg); } catch { /* silent */ }
            }
        };

        try {
            let workingScript = input.originalScript;

            // ═════ STEP 1: Analyze input ═════
            this.logger.log('📥 STEP 1: Analyzing user inputs...');
            progress('step1_init', 0, useEn ? 'Analyzing input...' : 'Phân tích đầu vào...');

            if (workingScript.length < 50) {
                throw new Error('Script must be at least 50 characters');
            }

            // ═════ STEP 2: Cross-language translation ═════
            const detectedSrc = input.sourceLanguage || this.detectLanguage(workingScript);
            const needsTranslation = detectedSrc && detectedSrc !== lang;

            if (needsTranslation) {
                this.logger.log(`🌐 STEP 2: Translating ${detectedSrc} → ${lang}...`);
                progress('translate', 2, `Translating ${LANG_NAMES[detectedSrc] || detectedSrc} → ${langName}...`);

                const transConvId = this.aiClient.startConversation(settings);
                try {
                    const translated = await this.aiClient.sendMessage(
                        settings, transConvId,
                        buildTranslatePrompt(LANG_NAMES[detectedSrc] || detectedSrc, langName, workingScript),
                        0.3,
                    );
                    if (translated && translated.trim().length > 50) {
                        workingScript = translated.trim();
                        results.translationApplied = true;
                    }
                } finally {
                    this.aiClient.endConversation(transConvId);
                }
                progress('translate_done', 5, useEn ? 'Translation complete' : 'Dịch xong');
            }

            // ═════ CONVERSATION 1: Analysis (Steps 3-6) ═════
            conv1Id = this.aiClient.startConversation(settings);
            this.logger.log(`Started Conv 1 (analysis): ${conv1Id.slice(0, 8)}...`);

            // ═════ STEP 3: Clean script (remove CTA, channel names) ═════
            this.logger.log('🧹 STEP 3: Removing channel names & CTAs...');
            progress('step3_clean', 5, useEn ? 'Removing channel name & CTA...' : 'Loại bỏ tên kênh & CTA...');

            let cleanedScript = workingScript;
            try {
                const cleaned = await this.aiClient.sendMessage(
                    settings, conv1Id,
                    buildCleanPrompt(langName, workingScript, useEn),
                    0.3,
                );
                if (cleaned.trim().length >= workingScript.length * 0.3) {
                    cleanedScript = cleaned.trim();
                }
            } catch (e) {
                this.logger.warn(`Step 3 clean failed: ${e.message}`);
            }

            // ═════ STEP 4: Memorize script (chunked) ═════
            this.logger.log('📖 STEP 4: Memorizing script...');
            progress('step4', 8, useEn ? 'Memorizing script...' : 'Ghi nhớ kịch bản...');

            const chunks: string[] = [];
            for (let i = 0; i < cleanedScript.length; i += CHUNK_SIZE) {
                chunks.push(cleanedScript.slice(i, i + CHUNK_SIZE));
            }

            for (let idx = 0; idx < chunks.length; idx++) {
                await this.aiClient.sendMessage(
                    settings, conv1Id,
                    buildMemorizePrompt(idx + 1, chunks.length, chunks[idx], useEn),
                    0.3,
                );
                progress('step4_chunk', 8 + Math.floor(6 * (idx + 1) / chunks.length),
                    `${useEn ? 'Memorizing' : 'Ghi nhớ'} ${idx + 1}/${chunks.length}...`);
            }

            // ═════ STEP 5: Extract main ideas + characters + metaphors ═════
            this.logger.log('📝 STEP 5: Extracting main ideas & characters...');
            progress('step5', 15, useEn ? 'Extracting ideas & characters...' : 'Trích xuất ý chính & nhân vật...');

            const step5Response = await this.aiClient.sendMessage(
                settings, conv1Id, buildStep5Prompt(useEn), 0.5,
            );
            const step5Data = this.parseJsonResponse(step5Response) as {
                main_ideas?: string[];
                characters?: unknown[];
                metaphors?: unknown[];
                original_perspective?: Record<string, unknown>;
            } | null;
            const mainIdeas: string[] = step5Data?.main_ideas || [];
            const characters: unknown[] = step5Data?.characters || [];
            const metaphors: unknown[] = step5Data?.metaphors || [];
            const perspective: Record<string, unknown> = step5Data?.original_perspective || {};

            results.originalAnalysis = {
                coreAngle: '', mainIdeas, viewerInsight: '',
                hookAnalysis: '', writingStyle: {}, culturalContext: '',
                narrativeVoice: '', retentionEngine: '', ctaStrategy: '',
            };

            progress('step5_done', 18, useEn ? 'Main ideas & characters extracted' : 'Trích xuất ý chính & nhân vật xong');

            // ═════ STEP 6: Cultural adaptation + perspective sync ═════
            // (Simplified — adaptation logic is in the AI prompt)
            let adaptedMainIdeas = mainIdeas;
            const adaptedCharacters = characters;
            progress('step6_done', 21, useEn ? 'Cultural adaptation complete' : 'Văn hóa đã xong');

            // ═════ END CONV 1, START CONV 2 ═════
            this.aiClient.endConversation(conv1Id);
            conv1Id = null;

            conv2Id = this.aiClient.startConversation(settings);
            this.logger.log(`Started Conv 2 (writing): ${conv2Id.slice(0, 8)}...`);

            // ═════ STEP 7: Load DNA + main ideas + characters ═════
            this.logger.log('🧬 STEP 7: Loading voice DNA...');
            progress('step7_dna', 22, useEn ? 'Loading voice DNA...' : 'Nạp DNA giọng văn...');

            const dnaSection = this.buildStyleDnaSection(input.styleProfile, useEn);
            const cultureRules = this.buildCultureRules(lang, input.dialect);
            const stDesc = input.storytellingStyle
                ? STORYTELLING_STYLES[input.storytellingStyle]?.[useEn ? 'en' : 'vi'] || input.storytellingStyle
                : '';

            const dnaPrompt = useEn
                ? `You are a video script writer. Memorize this Writing Style DNA:
${dnaSection}

📖 MAIN IDEAS:
${adaptedMainIdeas.map(i => `- ${i}`).join('\n')}

✏️ SETTINGS:
- Narrator: Always use "${resolvedNarrativeVoice}"
${resolvedAudienceAddress ? `- Audience: Always address as "${resolvedAudienceAddress}"` : '- Audience: Follow Style A naturally'}
${stDesc ? `- Storytelling Style: ${stDesc}` : ''}

🌍 CULTURAL & LANGUAGE RULES:
${cultureRules}

TARGET: ~${input.targetWordCount} words in ${langName}.
Write like a REAL PERSON. NO icons. Write ONLY in ${langName}.
Reply only "DNA memorized".`
                : `Bạn là người viết kịch bản video. Ghi nhớ DNA Giọng văn này:
${dnaSection}

📖 Ý CHÍNH:
${adaptedMainIdeas.map(i => `- ${i}`).join('\n')}

✏️ PHẦN TÙY BIẾN:
- Ngôi kể: Luôn xưng "${resolvedNarrativeVoice}"
${resolvedAudienceAddress ? `- Khán giả: Luôn gọi là "${resolvedAudienceAddress}"` : '- Khán giả: Theo Giọng văn A tự nhiên'}
${stDesc ? `- Phong cách kể: ${stDesc}` : ''}

MỤC TIÊU: ~${input.targetWordCount} từ bằng ${langName}.
Viết như NGƯỜI THẬT. KHÔNG icon. CHỈ viết bằng ${langName}.
Chỉ trả lời "Đã ghi nhớ DNA".`;

            await this.aiClient.sendMessage(settings, conv2Id, dnaPrompt, 0.3);
            progress('step7_done', 25, useEn ? 'Voice DNA loaded' : 'DNA giọng văn đã nạp');

            // ═════ STEP 8: Outline ═════
            this.logger.log('📋 STEP 8: Creating outline...');
            progress('step8', 26, useEn ? 'Creating outline...' : 'Tạo dàn ý...');

            const outlineResponse = await this.aiClient.sendMessage(
                settings, conv2Id,
                buildOutlinePrompt(langName, input.targetWordCount, useEn),
                0.5,
            );
            const outlineData = this.parseJsonResponse(outlineResponse) as {
                sections?: Array<Record<string, unknown>>;
            } | null;
            const sections: OutlineSection[] = (outlineData?.sections || []).map(
                (s, idx) => ({
                    id: (s.id as string) || `section_${idx + 1}`,
                    title: (s.title as string) || '',
                    description: (s.description as string) || '',
                    order: idx + 1,
                    wordCountTarget: (s.word_count_target as number) || 100,
                    keyPoints: (s.key_points as string[]) || [],
                    specialInstructions: (s.special_instructions as string) || '',
                }),
            );

            if (sections.length === 0) {
                // Fallback: create default 3-section outline
                sections.push(
                    { id: 'section_1', title: 'Opening', description: '', order: 1, wordCountTarget: Math.floor(input.targetWordCount * 0.3), keyPoints: [], specialInstructions: '' },
                    { id: 'section_2', title: 'Body', description: '', order: 2, wordCountTarget: Math.floor(input.targetWordCount * 0.5), keyPoints: [], specialInstructions: '' },
                    { id: 'section_3', title: 'Closing', description: '', order: 3, wordCountTarget: Math.floor(input.targetWordCount * 0.2), keyPoints: [], specialInstructions: '' },
                );
            }

            results.outlineA = {
                sections, totalTargetWords: input.targetWordCount,
                language: lang, dialect: input.dialect || '',
                channelName: input.channelName || '',
                storytellingStyle: input.storytellingStyle || '',
                narrativeVoice: input.narrativeVoice || '',
                audienceAddress: input.audienceAddress || '',
            };

            progress('step8_done', 33, `${useEn ? 'Outline' : 'Dàn ý'}: ${sections.length} sections`);

            // ═════ STEP 9: Full draft ═════
            this.logger.log('✍️ STEP 9: Writing full draft...');
            progress('step9', 34, useEn ? 'Writing full draft...' : 'Viết nháp toàn bộ...');

            const draftResponse = await this.aiClient.sendMessage(
                settings, conv2Id,
                buildDraftPrompt(langName, sections.length, input.targetWordCount, useEn),
                0.7,
            );
            const draftContent = this.cleanAiOutput(draftResponse.trim(), lang);
            progress('step9_done', 42, `${useEn ? 'Draft' : 'Nháp'}: ${draftContent.split(/\s+/).length} ${useEn ? 'words' : 'từ'}`);

            // ═════ STEP 10: Refine per section ═════
            this.logger.log(`✍️ STEP 10: Refining ${sections.length} sections...`);
            progress('step10', 43, `${useEn ? 'Refining' : 'Tinh chỉnh'} ${sections.length} ${useEn ? 'sections' : 'phần'}...`);

            let fullContent = '';
            const draftSections: DraftSection[] = [];
            const wordsPerSection = Math.max(100, Math.floor(input.targetWordCount / sections.length));
            const valueInstr = this.buildValueInstruction(input.valueType, input.customValue, useEn);
            const quizInstr = input.addQuiz
                ? (useEn ? '\n- Create a short A/B quiz' : '\n- Tạo 1 câu hỏi trắc nghiệm A/B')
                : '';

            for (let idx = 0; idx < sections.length; idx++) {
                const section = sections[idx];
                const isFirst = idx === 0;
                const isLast = idx === sections.length - 1;

                const sectionResponse = await this.aiClient.sendMessage(
                    settings, conv2Id,
                    buildSectionPrompt({
                        sectionNum: idx + 1,
                        sectionTitle: section.title,
                        totalSections: sections.length,
                        wordsPerSection,
                        langName,
                        channelName: input.channelName || '',
                        useEn,
                        isFirst,
                        isLast,
                        quizInstr: isFirst ? quizInstr : '',
                        valueInstr: isLast ? valueInstr : '',
                    }),
                    0.7,
                );

                const sectionContent = this.cleanAiOutput(sectionResponse.trim(), lang);
                const sectionWc = sectionContent.split(/\s+/).length;

                draftSections.push({
                    sectionId: isFirst ? 'opening' : (isLast ? 'closing' : `section_${idx + 1}`),
                    content: sectionContent,
                    version: 1,
                    wordCount: sectionWc,
                    status: 'refined',
                });

                if (fullContent) fullContent += '\n\n';
                fullContent += sectionContent;

                const pctDone = 44 + Math.floor(((idx + 1) / sections.length) * 36);
                progress(`cl${idx + 1}_done`, pctDone, `${useEn ? 'Section' : 'Phần'} ${idx + 1}: ${sectionWc} ${useEn ? 'words' : 'từ'}`);
            }

            results.draftSections = draftSections;

            // ═════ STEP 11: Auto-continue if under target ═════
            let currentWc = fullContent.split(/\s+/).length;
            const threshold = input.targetWordCount * 0.9;

            if (currentWc < threshold) {
                this.logger.log(`📝 STEP 11: Auto-continue ${currentWc}/${input.targetWordCount}`);
                progress('step11', 82, `${useEn ? 'Expanding' : 'Bổ sung'} (${currentWc}/${input.targetWordCount})...`);

                const needed = input.targetWordCount - currentWc;
                try {
                    const cont = await this.aiClient.sendMessage(
                        settings, conv2Id,
                        buildAutoContinuePrompt(needed, useEn),
                        0.7,
                    );
                    fullContent += '\n\n' + this.cleanAiOutput(cont.trim(), lang);
                } catch (e) {
                    this.logger.warn(`Auto-continue failed: ${e.message}`);
                }
            }

            currentWc = fullContent.split(/\s+/).length;
            progress('step11_done', 85, `${currentWc} ${useEn ? 'words' : 'từ'}`);

            // ═════ STEP 12: Quality review & fix ═════
            this.logger.log('🔍 STEP 12: Quality review...');
            progress('step12', 88, useEn ? 'Quality review...' : 'Kiểm tra chất lượng...');

            try {
                const reviewResp = await this.aiClient.sendMessage(
                    settings, conv2Id,
                    buildQualityReviewPrompt(
                        resolvedNarrativeVoice, resolvedAudienceAddress,
                        input.country || '', langName, useEn,
                    ),
                    0.3,
                );

                if (!reviewResp.includes('NO_ISSUES_FOUND')) {
                    const reviewData = this.parseJsonResponse(reviewResp);
                    const issues = (reviewData?.issues as Array<{ original: string; fixed: string }>) || [];
                    let fixCount = 0;
                    for (const issue of issues) {
                        if (issue.original && issue.fixed && fullContent.includes(issue.original)) {
                            fullContent = fullContent.replace(issue.original, issue.fixed);
                            fixCount++;
                        }
                    }
                    this.logger.log(`🔧 Step 12: Applied ${fixCount}/${issues.length} fixes`);
                }
            } catch (e) {
                this.logger.warn(`Step 12 failed: ${e.message}`);
            }

            progress('step12_done', 95, useEn ? 'Quality review complete' : 'Kiểm tra chất lượng xong');

            // ═════ FINALIZE ═════
            const finalScript = this.cleanAiOutput(fullContent.trim(), lang);
            const finalWordCount = finalScript.split(/\s+/).length;

            this.logger.log(`✅ Pipeline complete! ${finalWordCount} words`);
            progress('complete', 100, `${useEn ? 'Complete' : 'Hoàn thành'}: ${finalWordCount} ${useEn ? 'words' : 'từ'}`);

            return {
                success: true,
                finalScript,
                wordCount: finalWordCount,
                originalAnalysis: results.originalAnalysis as ScriptPipelineOutput['originalAnalysis'],
                outlineA: results.outlineA as ScriptPipelineOutput['outlineA'],
                draftSections,
            };

        } catch (error) {
            this.logger.error(`❌ Pipeline failed: ${error.message}`);
            return {
                success: false,
                finalScript: '',
                wordCount: 0,
                error: error.message,
            };
        } finally {
            // Cleanup conversations
            for (const cid of [conv1Id, conv2Id]) {
                if (cid) {
                    try { this.aiClient.endConversation(cid); } catch { /* silent */ }
                }
            }
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private resolveNarrativeVoice(input: ScriptPipelineInput): string {
        if (input.customNarrativeVoice?.trim()) return input.customNarrativeVoice.trim();
        if (input.narrativeVoice) {
            if (input.narrativeVoice === 'first_person') return LANG_NV_FIRST[input.language] || 'I/me';
            if (input.narrativeVoice === 'second_person') return LANG_NV_SECOND[input.language] || 'you';
            if (input.narrativeVoice === 'third_person') return LANG_NV_THIRD[input.language] || 'they';
        }
        return LANG_NV_FIRST[input.language] || 'I/me';
    }

    private resolveAudienceAddress(input: ScriptPipelineInput): string {
        if (input.customAudienceAddress?.trim()) return input.customAudienceAddress.trim();
        return input.audienceAddress || '';
    }

    private buildStyleDnaSection(
        style: ScriptPipelineInput['styleProfile'],
        useEn: boolean,
    ): string {
        if (!style) return useEn ? '(No Style DNA available)' : '(Không có Style DNA)';
        const lines: string[] = [];
        const label = useEn ? '🧬 WRITING STYLE DNA:' : '🧬 DNA GIỌNG VĂN:';
        lines.push(label);
        if (style.tone) lines.push(`- ${useEn ? 'Tone' : 'Giọng điệu'}: ${style.tone}`);
        if (style.hookStyle) lines.push(`- HOOK: ${style.hookStyle}`);
        if (style.pacing) lines.push(`- ${useEn ? 'Pacing' : 'Nhịp'}: ${style.pacing}`);
        if (style.emotionalRange) lines.push(`- ${useEn ? 'Emotional range' : 'Cảm xúc'}: ${style.emotionalRange}`);
        if (style.sentenceStructure) lines.push(`- ${useEn ? 'Sentence structure' : 'Cấu trúc câu'}: ${style.sentenceStructure}`);
        if (style.vocabularyLevel) lines.push(`- ${useEn ? 'Vocabulary' : 'Từ vựng'}: ${style.vocabularyLevel}`);
        if (style.keyPhrases?.length) lines.push(`- ${useEn ? 'Key phrases' : 'Cụm từ đặc trưng'}: ${style.keyPhrases.slice(0, 5).join(', ')}`);
        if (style.transitionPatterns?.length) lines.push(`- ${useEn ? 'Transitions' : 'Chuyển tiếp'}: ${style.transitionPatterns.slice(0, 3).join(', ')}`);
        if (style.uniquePatterns?.length) lines.push(`- ${useEn ? 'Unique patterns' : 'Pattern độc đáo'}: ${style.uniquePatterns.slice(0, 3).join(', ')}`);
        return lines.join('\n');
    }

    private buildCultureRules(lang: string, dialect?: string): string {
        const cfg = LANGUAGE_CULTURE[lang] || LANGUAGE_CULTURE.en;
        const parts: string[] = [];
        if (cfg.writingSystem) parts.push(`- ${cfg.writingSystem}`);
        if (cfg.idiomRule) parts.push(`- ${cfg.idiomRule}`);
        if (cfg.culturalNotes) parts.push(`- ${cfg.culturalNotes}`);
        if (cfg.formality) parts.push(`- ${cfg.formality}`);
        return parts.join('\n') || '';
    }

    private buildValueInstruction(
        valueType?: string, customValue?: string, useEn = false,
    ): string {
        if (customValue?.trim()) {
            return `\n- ${useEn ? 'Add value' : 'Thêm giá trị'}: ${customValue}`;
        }
        if (!valueType) return '';
        const map: Record<string, { en: string; vi: string }> = {
            sell: { en: 'call to purchase', vi: 'kêu gọi mua hàng' },
            engage: { en: 'engagement & subscribe', vi: 'tương tác & đăng ký' },
            community: { en: 'join community & subscribe', vi: 'tham gia cộng đồng & đăng ký' },
        };
        const desc = map[valueType]?.[useEn ? 'en' : 'vi'] || valueType;
        return `\n- ${useEn ? 'Add value' : 'Thêm giá trị'}: ${desc}`;
    }

    /**
     * Clean AI output — remove prompt leakage, fix formatting.
     * Port of v1 _clean_ai_output().
     */
    private cleanAiOutput(content: string, language: string): string {
        let text = content;

        // Remove code block wrappers
        text = text.replace(/^```(?:json|markdown)?\s*/gm, '');
        text = text.replace(/\s*```$/gm, '');

        // Remove common AI artifacts
        text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold markers
        text = text.replace(/^#+\s+/gm, ''); // Headers
        text = text.replace(/^[-*]\s+/gm, ''); // Bullet points
        text = text.replace(/\[.*?\]\(.*?\)/g, ''); // Markdown links

        // Remove emojis (TTS incompatible)
        text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

        // Clean special chars that cause TTS issues (from v1 _clean_special)
        text = text.replace(/[[\]{}()*_~`]/g, '');

        // Clean excessive whitespace
        text = text.replace(/\n{3,}/g, '\n\n');
        text = text.trim();

        return text;
    }

    /**
     * Parse JSON from AI response with fallback strategies.
     * Handles code blocks, trailing commas, etc.
     */
    private parseJsonResponse(response: string): Record<string, unknown> | null {
        let clean = response.trim();

        // Remove code block wrappers
        if (clean.startsWith('```')) {
            clean = clean.replace(/^```(?:json)?\s*/m, '');
            clean = clean.replace(/\s*```$/m, '');
        }

        // Find first { ... } block
        const startIdx = clean.indexOf('{');
        if (startIdx === -1) return null;

        let braceCount = 0;
        let endIdx = startIdx;
        for (let i = startIdx; i < clean.length; i++) {
            if (clean[i] === '{') braceCount++;
            if (clean[i] === '}') braceCount--;
            if (braceCount === 0) {
                endIdx = i + 1;
                break;
            }
        }

        const jsonStr = clean.slice(startIdx, endIdx);

        try {
            return JSON.parse(jsonStr);
        } catch {
            // Fix trailing commas
            try {
                const fixed = jsonStr.replace(/,(\s*[}\]])/g, '$1');
                return JSON.parse(fixed);
            } catch {
                this.logger.warn('Could not parse JSON from AI response');
                return null;
            }
        }
    }

    /**
     * Simple language detection from script content.
     */
    private detectLanguage(text: string): string {
        const sample = text.slice(0, 500);
        // Vietnamese diacritics
        if (/[àáạảãăắằẳẵặâấầẩẫậèéẹẻẽêếềểễệìíịỉĩòóọỏõôốồổỗộơớờởỡợùúụủũưứừửữựỳýỵỷỹđ]/i.test(sample)) return 'vi';
        // Japanese
        if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(sample)) return 'ja';
        // Korean
        if (/[\uAC00-\uD7AF]/.test(sample)) return 'ko';
        // Chinese (without Japanese kana)
        if (/[\u4E00-\u9FFF]/.test(sample) && !/[\u3040-\u30FF]/.test(sample)) return 'zh';
        // Thai
        if (/[\u0E00-\u0E7F]/.test(sample)) return 'th';
        // Russian/Cyrillic
        if (/[\u0400-\u04FF]/.test(sample)) return 'ru';
        return 'en';
    }
}
