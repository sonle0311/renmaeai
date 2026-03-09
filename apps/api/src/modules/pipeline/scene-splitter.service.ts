/**
 * Scene Splitter Service — Hard Algorithm (NO AI)
 *
 * Port from v1 split_script_to_scenes() thuật toán cứng.
 * Uses TTS speed per language to calibrate scene duration.
 *
 * Core Analysis §2: "Chia cảnh không dựa vào AI (phòng ngừa ảo giác)
 * mà dùng thuật toán logic cứng."
 */

import { Injectable, Logger } from '@nestjs/common';
import type { Scene } from './script-engine.types';
import { TTS_SPEED_BY_LANGUAGE, SCENE_DURATION_RANGE } from './script-engine.types';

@Injectable()
export class SceneSplitterService {
    private readonly logger = new Logger(SceneSplitterService.name);

    /**
     * Split a script into scenes calibrated for TTS + VEO video length.
     *
     * @param script - Final polished script text
     * @param language - ISO language code (vi, en, ja, etc.)
     * @returns Scene[] with 100% word preservation
     */
    splitToScenes(script: string, language: string): Scene[] {
        const ttsSpeed = TTS_SPEED_BY_LANGUAGE[language] || 2.8;
        const { min: minDuration, max: maxDuration, target: targetDuration } = SCENE_DURATION_RANGE;

        // Calculate word limits per scene
        const targetWords = Math.round(ttsSpeed * targetDuration);
        const minWords = Math.round(ttsSpeed * minDuration);
        const maxWords = Math.round(ttsSpeed * maxDuration);

        // Split by sentences first
        const sentences = this.splitToSentences(script, language);

        if (sentences.length === 0) {
            return [{
                id: 1,
                text: script.trim(),
                wordCount: this.countWords(script),
                estimatedDurationSeconds: this.countWords(script) / ttsSpeed,
            }];
        }

        const scenes: Scene[] = [];
        let currentText = '';
        let currentWords = 0;
        let sceneId = 1;

        for (const sentence of sentences) {
            const sentenceWords = this.countWords(sentence);

            // If adding this sentence would exceed max, start new scene
            if (currentWords + sentenceWords > maxWords && currentWords >= minWords) {
                scenes.push({
                    id: sceneId++,
                    text: currentText.trim(),
                    wordCount: currentWords,
                    estimatedDurationSeconds: Math.round((currentWords / ttsSpeed) * 10) / 10,
                });
                currentText = sentence;
                currentWords = sentenceWords;
            } else {
                currentText += (currentText ? ' ' : '') + sentence;
                currentWords += sentenceWords;
            }
        }

        // Don't forget last scene
        if (currentText.trim()) {
            scenes.push({
                id: sceneId++,
                text: currentText.trim(),
                wordCount: currentWords,
                estimatedDurationSeconds: Math.round((currentWords / ttsSpeed) * 10) / 10,
            });
        }

        // Validate: merge tiny last scene into previous
        if (scenes.length > 1) {
            const last = scenes[scenes.length - 1];
            if (last.wordCount < minWords) {
                const prev = scenes[scenes.length - 2];
                prev.text += ' ' + last.text;
                prev.wordCount += last.wordCount;
                prev.estimatedDurationSeconds = Math.round((prev.wordCount / ttsSpeed) * 10) / 10;
                scenes.pop();
            }
        }

        // Verify 100% word preservation
        const originalWords = this.countWords(script);
        const sceneWords = scenes.reduce((sum, s) => sum + s.wordCount, 0);
        if (Math.abs(originalWords - sceneWords) > 2) {
            this.logger.warn(`Word count mismatch: original=${originalWords}, scenes=${sceneWords}`);
        }

        this.logger.log(`Split into ${scenes.length} scenes (${originalWords} words, ${language}, ${ttsSpeed} w/s)`);
        return scenes;
    }

    private splitToSentences(text: string, language: string): string[] {
        // For CJK languages, split on period + comma patterns
        if (['ja', 'zh', 'ko', 'th'].includes(language)) {
            return text
                .split(/(?<=[。！？\n])\s*/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        // For alphabetic languages, split on sentence-ending punctuation
        return text
            .split(/(?<=[.!?…])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    private countWords(text: string): number {
        return text.trim().split(/\s+/).filter(w => w.length > 0).length;
    }
}
