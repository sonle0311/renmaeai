import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Đóng gói scenes thành file ZIP.
 * Cấu trúc: Scene_01/video.mp4, Scene_01/audio.mp3, ...
 */
export async function createZipFromScenes(
    scenes: Array<{
        name: string;
        video?: Blob;
        audio?: Blob;
        script?: string;
    }>,
    zipFileName: string = "renmaeai-export.zip",
    onProgress?: (percent: number) => void,
): Promise<void> {
    const zip = new JSZip();

    scenes.forEach((scene, i) => {
        const folderName = `Scene_${String(i + 1).padStart(2, "0")}`;
        const folder = zip.folder(folderName)!;

        if (scene.video) {
            folder.file("video.mp4", scene.video);
        }
        if (scene.audio) {
            folder.file("audio.mp3", scene.audio);
        }
        if (scene.script) {
            folder.file("script.txt", scene.script);
        }
    });

    const blob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
        (metadata) => {
            onProgress?.(Math.round(metadata.percent));
        },
    );

    saveAs(blob, zipFileName);
}

/**
 * Đóng gói single MP4 + metadata thành ZIP.
 */
export async function createSingleZip(
    videoBlob: Blob,
    fileName: string,
    metadata?: Record<string, string>,
): Promise<void> {
    const zip = new JSZip();
    zip.file(`${fileName}.mp4`, videoBlob);

    if (metadata) {
        zip.file("metadata.json", JSON.stringify(metadata, null, 2));
    }

    const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
    });

    saveAs(blob, `${fileName}.zip`);
}
