/**
 * Video Segment Service — Build 8s segments from TTS durations
 *
 * VEO generates clips of fixed length (typically 8s).
 * This service calculates which scene content maps to which 8s segment,
 * handling overlap when scenes cross segment boundaries.
 *
 * V1 ref: ScriptWorkflow.tsx:9291-9314 (Step 3a: Build Video Segments)
 * NOTE: This is a deterministic algorithm — no AI calls needed.
 */

import { Injectable, Logger } from "@nestjs/common";
import type { VideoSegmentInput, VideoSegmentOutput } from "./pipeline.types";

@Injectable()
export class VideoSegmentService {
    private readonly logger = new Logger(VideoSegmentService.name);

    build(input: VideoSegmentInput): VideoSegmentOutput[] {
        const segmentLength = input.segmentLengthSeconds || 8;
        const scenes = input.scenes;

        if (!scenes.length) return [];

        // Calculate total duration
        const totalDuration = scenes.reduce((sum, s) => sum + s.voiceDurationSeconds, 0);
        const numSegments = Math.max(1, Math.ceil(totalDuration / segmentLength));

        this.logger.log(
            `Building ${numSegments} segments (${segmentLength}s each) from ${scenes.length} scenes (${totalDuration.toFixed(1)}s total)`,
        );

        // Build timeline: each scene has absolute start/end times
        const timeline: Array<{
            sceneId: number;
            content: string;
            start: number;
            end: number;
        }> = [];

        let cursor = 0;
        for (const scene of scenes) {
            timeline.push({
                sceneId: scene.sceneId,
                content: scene.content,
                start: cursor,
                end: cursor + scene.voiceDurationSeconds,
            });
            cursor += scene.voiceDurationSeconds;
        }

        // Build segments
        const segments: VideoSegmentOutput[] = [];
        for (let i = 0; i < numSegments; i++) {
            const segStart = i * segmentLength;
            const segEnd = Math.min(segStart + segmentLength, totalDuration);

            // Find overlapping scenes
            const sourceScenes: Array<{ sceneId: number; overlapRatio: number }> = [];
            const contentParts: string[] = [];

            for (const t of timeline) {
                const overlapStart = Math.max(segStart, t.start);
                const overlapEnd = Math.min(segEnd, t.end);
                const overlapDuration = Math.max(0, overlapEnd - overlapStart);

                if (overlapDuration > 0) {
                    const sceneDuration = t.end - t.start;
                    const overlapRatio = sceneDuration > 0
                        ? Math.round((overlapDuration / sceneDuration) * 100) / 100
                        : 0;

                    sourceScenes.push({ sceneId: t.sceneId, overlapRatio });
                    contentParts.push(t.content);
                }
            }

            segments.push({
                segmentId: i + 1,
                startTime: Math.round(segStart * 100) / 100,
                endTime: Math.round(segEnd * 100) / 100,
                duration: Math.round((segEnd - segStart) * 100) / 100,
                content: contentParts.join(" "),
                sourceScenes,
            });
        }

        this.logger.log(`Built ${segments.length} video segments`);
        return segments;
    }
}
