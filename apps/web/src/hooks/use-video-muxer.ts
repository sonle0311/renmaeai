"use client";

import { useState, useCallback } from "react";
import { muxVideoWithAudio, assembleScenes } from "@/lib/ffmpeg/client-assemble";
import { createZipFromScenes } from "@/lib/ffmpeg/archiver";
import { saveAs } from "file-saver";

type MuxerState = {
    status: "idle" | "loading" | "processing" | "done" | "error";
    progress: number;
    message: string;
    error?: string;
};

/**
 * Hook quản lý toàn bộ luồng Download:
 * - Mux single video (trim + audio)
 * - Assemble multiple scenes
 * - Download as ZIP
 */
export function useVideoMuxer() {
    const [state, setState] = useState<MuxerState>({
        status: "idle",
        progress: 0,
        message: "",
    });

    const reset = useCallback(() => {
        setState({ status: "idle", progress: 0, message: "" });
    }, []);

    /**
     * Tải 1 video đã mux (trim theo audio).
     */
    const downloadMuxedVideo = useCallback(
        async (videoUrl: string, audioUrl: string, fileName: string) => {
            try {
                setState({ status: "loading", progress: 0, message: "Đang khởi tạo..." });

                const blob = await muxVideoWithAudio(videoUrl, audioUrl, (progress, message) => {
                    setState({ status: "processing", progress, message });
                });

                saveAs(blob, `${fileName}.mp4`);
                setState({ status: "done", progress: 100, message: "Tải thành công!" });
            } catch (err) {
                setState({
                    status: "error",
                    progress: 0,
                    message: "Lỗi xử lý video",
                    error: err instanceof Error ? err.message : "Unknown error",
                });
            }
        },
        [],
    );

    /**
     * Tải ZIP chứa nhiều scenes (mỗi scene đã mux).
     */
    const downloadScenesZip = useCallback(
        async (
            scenes: Array<{ videoUrl: string; audioUrl: string; name: string; script?: string }>,
            zipFileName: string,
        ) => {
            try {
                setState({ status: "loading", progress: 0, message: "Đang xử lý scenes..." });

                // Mux all scenes
                const muxedScenes = await assembleScenes(scenes, (progress, message) => {
                    setState({ status: "processing", progress: Math.round(progress * 0.8), message });
                });

                setState({ status: "processing", progress: 80, message: "Đang nén ZIP..." });

                // Create ZIP
                await createZipFromScenes(
                    muxedScenes.map((s, i) => ({
                        name: s.name,
                        video: s.blob,
                        script: scenes[i]?.script,
                    })),
                    zipFileName,
                    (percent) => {
                        setState({
                            status: "processing",
                            progress: 80 + Math.round(percent * 0.2),
                            message: `Nén ZIP... ${percent}%`,
                        });
                    },
                );

                setState({ status: "done", progress: 100, message: "Tải ZIP thành công!" });
            } catch (err) {
                setState({
                    status: "error",
                    progress: 0,
                    message: "Lỗi xử lý",
                    error: err instanceof Error ? err.message : "Unknown error",
                });
            }
        },
        [],
    );

    return {
        ...state,
        downloadMuxedVideo,
        downloadScenesZip,
        reset,
    };
}
