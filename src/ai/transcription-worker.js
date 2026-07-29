import { pipeline, env } from "@huggingface/transformers";

let transcriber = null;
let isLoading = false;

self.addEventListener("message", async (event) => {
    const message = event.data;

    if (!message || !message.type) {
        return;
    }

    if (message.type === "load") {
        await loadWhisper(message.wasmBaseUrl);
        return;
    }

    if (message.type === "transcribe") {
        await transcribeAudio(
            message.audio,
            message.chunkId
        );
    }
});

async function loadWhisper(wasmBaseUrl) {
    if (transcriber) {
        self.postMessage({
            type: "ready"
        });

        return;
    }

    if (isLoading) {
        return;
    }

    isLoading = true;

    try {
        env.backends.onnx.wasm.wasmPaths =
            wasmBaseUrl;

        env.backends.onnx.wasm.numThreads = 1;

        self.postMessage({
            type: "status",
            message:
                "Downloading Whisper. The first load may take a few minutes..."
        });

        transcriber = await pipeline(
            "automatic-speech-recognition",
            "onnx-community/whisper-tiny.en",
            {
                device: "wasm",
                dtype: "fp32"
            }
        );

        self.postMessage({
            type: "ready"
        });
    } catch (error) {
        console.error(
            "Whisper worker failed to load:",
            error
        );

        self.postMessage({
            type: "error",
            stage: "load",
            message:
                error instanceof Error
                    ? error.message
                    : String(error)
        });
    } finally {
        isLoading = false;
    }
}

async function transcribeAudio(
    audio,
    chunkId
) {
    if (!transcriber) {
        self.postMessage({
            type: "error",
            stage: "transcription",
            chunkId,
            message:
                "Whisper has not been loaded."
        });

        return;
    }

    try {
        const samples =
            audio instanceof Float32Array
                ? audio
                : new Float32Array(audio);

        const result =
            await transcriber(samples);

        self.postMessage({
            type: "result",
            chunkId,
            text: result.text.trim()
        });
    } catch (error) {
        console.error(
            "Whisper worker transcription failed:",
            error
        );

        self.postMessage({
            type: "error",
            stage: "transcription",
            chunkId,
            message:
                error instanceof Error
                    ? error.message
                    : String(error)
        });
    }
}