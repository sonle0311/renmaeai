/**
 * YouTube Extract Service v4
 *
 * Uses `youtube-transcript-plus` library (tested & working).
 * Also fetches video metadata via YouTube's oEmbed API (no key needed).
 */

import { Injectable, Logger } from "@nestjs/common";
import { fetchTranscript } from "youtube-transcript-plus";

interface YouTubeMetadata {
    videoId: string;
    title: string;
    duration?: string;
    thumbnail?: string;
    channelName?: string;
}

interface YouTubeExtractResult {
    success: boolean;
    transcript?: string;
    metadata?: YouTubeMetadata;
    error?: string;
}

@Injectable()
export class YoutubeExtractService {
    private readonly logger = new Logger(YoutubeExtractService.name);

    /**
     * Extract transcript + metadata from a YouTube URL.
     */
    async extract(url: string): Promise<YouTubeExtractResult> {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            return { success: false, error: "Invalid YouTube URL" };
        }

        this.logger.log(`Extracting transcript for video: ${videoId}`);

        try {
            // 1. Fetch metadata via oEmbed (lightweight, no API key)
            const metadata = await this.fetchMetadata(videoId);

            // 2. Fetch transcript using youtube-transcript-plus
            const segments = await fetchTranscript(videoId);

            if (!segments || segments.length === 0) {
                return {
                    success: false,
                    metadata,
                    error: "Video này không có phụ đề/transcript. Hãy nhập script thủ công.",
                };
            }

            // 3. Join segments into flowing text
            const transcript = segments
                .map((s: { text: string }) => s.text.trim())
                .filter((t: string) => t.length > 0)
                .join(" ")
                .replace(/\s{2,}/g, " ")
                .replace(/\s+([.,!?])/g, "$1")
                .trim();

            if (transcript.length < 20) {
                return {
                    success: false,
                    metadata,
                    error: "Transcript quá ngắn. Thử nhập script thủ công.",
                };
            }

            this.logger.log(
                `Extracted ${transcript.length} chars (${segments.length} segments) from ${videoId}`,
            );
            return { success: true, transcript, metadata };
        } catch (error) {
            const errorMsg = error?.message || String(error);
            this.logger.error(`YouTube extract failed for ${videoId}: ${errorMsg}`);

            // Provide user-friendly error messages
            if (errorMsg.includes("Disabled") || errorMsg.includes("disabled")) {
                return {
                    success: false,
                    error: "Video này đã tắt phụ đề. Hãy nhập script thủ công.",
                };
            }
            if (errorMsg.includes("Unavailable") || errorMsg.includes("unavailable")) {
                return {
                    success: false,
                    error: "Video không khả dụng (private hoặc đã xóa).",
                };
            }
            if (errorMsg.includes("Too Many") || errorMsg.includes("too many")) {
                return {
                    success: false,
                    error: "YouTube đang giới hạn requests. Thử lại sau 1 phút.",
                };
            }

            return {
                success: false,
                error: `Không thể lấy transcript: ${errorMsg}`,
            };
        }
    }

    /**
     * Fetch video metadata via YouTube oEmbed API (no API key needed).
     */
    private async fetchMetadata(videoId: string): Promise<YouTubeMetadata> {
        try {
            const response = await fetch(
                `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
            );
            if (response.ok) {
                const data = await response.json();
                return {
                    videoId,
                    title: data.title || `Video ${videoId}`,
                    channelName: data.author_name || undefined,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                };
            }
        } catch {
            // oEmbed failed, use fallback
        }

        return {
            videoId,
            title: `Video ${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        };
    }

    /**
     * Extract video ID from various YouTube URL formats.
     */
    private extractVideoId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
}
