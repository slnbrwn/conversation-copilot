const startBtn = document.getElementById("startBtn");
const status = document.getElementById("status");
const meterFill = document.getElementById("meterFill");
const levelText = document.getElementById("levelText");

let mediaStream = null;
let audioContext = null;
let analyser = null;
let animationFrameId = null;
let isListening = false;

startBtn.addEventListener("click", () => {
    if (isListening) {
        stopListening();
        return;
    }

    startListening();
});

function startListening() {
    startBtn.disabled = true;
    status.textContent = "Connecting to this tab…";

    chrome.tabCapture.capture(
        {
            audio: true,
            video: false
        },
        async (stream) => {
            if (chrome.runtime.lastError) {
                showError(chrome.runtime.lastError.message);
                return;
            }

            if (!stream) {
                showError("Chrome did not return an audio stream.");
                return;
            }

            try {
                mediaStream = stream;
                audioContext = new AudioContext();

                if (audioContext.state === "suspended") {
                    await audioContext.resume();
                }

                const source =
                    audioContext.createMediaStreamSource(mediaStream);

                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.7;

                source.connect(analyser);

                // Keep the YouTube or lesson audio audible.
                source.connect(audioContext.destination);

                isListening = true;
                startBtn.disabled = false;
                startBtn.textContent = "Stop Listening";
                status.textContent = "Listening to tab audio";

                measureAudioLevel();
            } catch (error) {
                showError(error.message);
            }
        }
    );
}

function measureAudioLevel() {
    if (!analyser || !isListening) {
        return;
    }

    const samples = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(samples);

    let sumOfSquares = 0;

    for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        sumOfSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumOfSquares / samples.length);
    const level = Math.min(100, Math.round(rms * 500));

    meterFill.style.width = `${level}%`;
    levelText.textContent = `${level}%`;

    animationFrameId = requestAnimationFrame(measureAudioLevel);
}

function stopListening() {
    isListening = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    analyser = null;

    meterFill.style.width = "0%";
    levelText.textContent = "0%";
    status.textContent = "Ready";
    startBtn.textContent = "Start Listening";
    startBtn.disabled = false;
}

function showError(message) {
    console.error(message);

    isListening = false;
    startBtn.disabled = false;
    startBtn.textContent = "Try Again";
    status.textContent = message;
}

import { pipeline, env } from "@huggingface/transformers";

// Force Transformers.js to use the ONNX files stored inside the extension.
env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("wasm/");
env.backends.onnx.wasm.numThreads = 1;

const loadWhisperButton = document.querySelector("#load-whisper");
const whisperStatus = document.querySelector("#whisper-status");

let transcriber = null;

loadWhisperButton.addEventListener("click", async () => {
    if (transcriber) {
        whisperStatus.textContent = "Whisper is already loaded.";
        return;
    }

    try {
        loadWhisperButton.disabled = true;
        whisperStatus.textContent =
            "Downloading Whisper. The first load may take a few minutes...";

        transcriber = await pipeline(
            "automatic-speech-recognition",
            "onnx-community/whisper-tiny.en",
            {
                device: "wasm",
                dtype: "fp32"
            }
        );

        whisperStatus.textContent = "Whisper loaded successfully.";
        testWhisperButton.disabled = false;
    } catch (error) {
        console.error("Whisper failed to load:", error);

        whisperStatus.textContent =
            "Whisper failed to load. Check the extension console.";

        loadWhisperButton.disabled = false;
    }
});
const testWhisperButton = document.querySelector("#test-whisper");
const transcript = document.querySelector("#transcript");

testWhisperButton.addEventListener("click", async () => {
    if (!transcriber) {
        whisperStatus.textContent = "Load Whisper first.";
        return;
    }

    try {
        testWhisperButton.disabled = true;
        testWhisperButton.textContent = "Transcribing...";
        transcript.textContent = "Processing the test audio...";

        const result = await transcriber(
            "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav"
        );

        transcript.textContent = result.text.trim();
        testWhisperButton.textContent = "Test Again";
    } catch (error) {
        console.error("Test transcription failed:", error);
        transcript.textContent =
            "Test transcription failed. Check the extension console.";
        testWhisperButton.textContent = "Try Again";
    } finally {
        testWhisperButton.disabled = false;
    }
});