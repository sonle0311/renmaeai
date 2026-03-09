/**
 * TTS Service — Edge TTS Audio Generation
 *
 * Uses edge-tts-universal for free, high-quality TTS via Microsoft Edge.
 * Generates MP3 audio files for each scene.
 *
 * Switched from @bestcodes/edge-tts (broken DRM/Sec-MS-GEC tokens → 403)
 * to edge-tts-universal which has up-to-date Microsoft API compatibility.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TtsSynthesizeInput {
    text: string;
    voice: string;
    productionId: string;
    sceneId: number;
    rate?: string;
    volume?: string;
    pitch?: string;
}

export interface TtsSynthesizeResult {
    audioUrl: string;
    durationSeconds: number;
}

@Injectable()
export class TtsService {
    private readonly logger = new Logger(TtsService.name);
    private readonly uploadDir: string;
    private edgeTtsModule: any = null;

    constructor() {
        // Store TTS files in uploads/tts/
        this.uploadDir = path.join(process.cwd(), 'uploads', 'tts');
        fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    /**
     * Lazy-load the ESM edge-tts-universal module.
     */
    private async getEdgeTts() {
        if (!this.edgeTtsModule) {
            this.edgeTtsModule = await import('edge-tts-universal');
        }
        return this.edgeTtsModule;
    }

    /**
     * Synthesize text to MP3 using Edge TTS.
     */
    async synthesize(input: TtsSynthesizeInput): Promise<TtsSynthesizeResult> {
        const sceneDir = path.join(this.uploadDir, input.productionId);
        fs.mkdirSync(sceneDir, { recursive: true });

        const outputPath = path.join(sceneDir, `scene-${input.sceneId}.mp3`);

        this.logger.log(
            `Generating TTS for scene ${input.sceneId} (voice: ${input.voice}, ${input.text.length} chars)`,
        );

        try {
            const { EdgeTTS } = await this.getEdgeTts();

            const tts = new EdgeTTS(input.text, input.voice, {
                rate: input.rate || '+0%',
                volume: input.volume || '+0%',
                pitch: input.pitch || '+0Hz',
            });

            const result = await tts.synthesize();
            const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

            // Write to file
            fs.writeFileSync(outputPath, audioBuffer);

            const estimatedDuration = Math.max(1, Math.round(audioBuffer.length / 2000));

            // Return relative URL for serving
            const audioUrl = `/uploads/tts/${input.productionId}/scene-${input.sceneId}.mp3`;

            this.logger.log(
                `TTS generated: ${outputPath} (${audioBuffer.length} bytes, ~${estimatedDuration}s)`,
            );

            return {
                audioUrl,
                durationSeconds: estimatedDuration,
            };
        } catch (error) {
            this.logger.error(`TTS synthesis failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get list of available Vietnamese voices.
     */
    getVietnameseVoices(): Array<{ name: string; gender: string }> {
        return [
            { name: 'vi-VN-HoaiMyNeural', gender: 'Female' },
            { name: 'vi-VN-NamMinhNeural', gender: 'Male' },
        ];
    }

    /**
     * Clean up TTS files for a production.
     */
    async cleanup(productionId: string): Promise<void> {
        const dir = path.join(this.uploadDir, productionId);
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            this.logger.log(`Cleaned up TTS files for ${productionId}`);
        }
    }
}
