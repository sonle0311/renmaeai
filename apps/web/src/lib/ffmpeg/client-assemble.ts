import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Load FFmpeg WASM instance (singleton).
 * Cần Cross-Origin Isolation headers để hoạt động.
 */
export async function loadFFmpeg(
    onProgress?: ProgressCallback,
): Promise<FFmpeg> {
    if (ffmpeg?.loaded) return ffmpeg;

    ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
        onProgress?.(Math.round(progress * 100), "Đang xử lý FFmpeg...");
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    return ffmpeg;
}

/**
 * Đo duration của audio file bằng Web Audio API.
 */
export async function getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.addEventListener("loadedmetadata", () => {
            resolve(audio.duration);
        });
        audio.addEventListener("error", reject);
        audio.src = URL.createObjectURL(audioBlob);
    });
}

/**
 * Trim video theo duration audio và mux audio vào.
 * Returns: MP4 Blob
 */
export async function muxVideoWithAudio(
    videoUrl: string,
    audioUrl: string,
    onProgress?: ProgressCallback,
): Promise<Blob> {
    onProgress?.(5, "Đang tải FFmpeg...");
    const ff = await loadFFmpeg(onProgress);

    onProgress?.(15, "Đang tải video...");
    const videoData = await fetchFile(videoUrl);

    onProgress?.(30, "Đang tải audio...");
    const audioData = await fetchFile(audioUrl);

    // Write files to FFmpeg virtual filesystem
    await ff.writeFile("input.mp4", videoData);
    await ff.writeFile("input.mp3", audioData);

    // Get audio duration
    const rawAudio = audioData instanceof Uint8Array ? audioData.buffer.slice(0) as unknown as BlobPart : audioData as BlobPart;
    const audioBlob = new Blob([rawAudio]);
    const audioDuration = await getAudioDuration(audioBlob);

    onProgress?.(40, `Đang cắt video (${audioDuration.toFixed(1)}s)...`);

    // Trim video to audio duration + mux
    await ff.exec([
        "-i", "input.mp4",
        "-i", "input.mp3",
        "-t", audioDuration.toString(),
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        "-y",
        "output.mp4",
    ]);

    onProgress?.(90, "Đang xuất file...");

    const output = await ff.readFile("output.mp4");
    const rawOutput = output instanceof Uint8Array ? output.buffer.slice(0) as unknown as BlobPart : output as BlobPart;
    const blob = new Blob([rawOutput], { type: "video/mp4" });

    // Cleanup FFmpeg virtual filesystem
    await ff.deleteFile("input.mp4");
    await ff.deleteFile("input.mp3");
    await ff.deleteFile("output.mp4");

    onProgress?.(100, "Hoàn tất!");
    return blob;
}

/**
 * Assemble nhiều scenes thành từng MP4 files.
 */
export async function assembleScenes(
    scenes: Array<{ videoUrl: string; audioUrl: string; name: string }>,
    onProgress?: ProgressCallback,
): Promise<Array<{ name: string; blob: Blob }>> {
    const results: Array<{ name: string; blob: Blob }> = [];

    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const sceneProgress = (progress: number, msg: string) => {
            const overallProgress = Math.round(
                ((i + progress / 100) / scenes.length) * 100,
            );
            onProgress?.(overallProgress, `Scene ${i + 1}/${scenes.length}: ${msg}`);
        };

        const blob = await muxVideoWithAudio(
            scene.videoUrl,
            scene.audioUrl,
            sceneProgress,
        );
        results.push({ name: scene.name, blob });
    }

    return results;
}
