import { analyzeTranscriptChunk } from "./teaching/rule-engine.js";
// --------------------------------------------------
// Page elements
// --------------------------------------------------

const startBtn = document.getElementById("startBtn");
const status = document.getElementById("status");
const meterFill = document.getElementById("meterFill");
const levelText = document.getElementById("levelText");

const loadWhisperButton =
    document.querySelector("#load-whisper");

const whisperStatus =
    document.querySelector("#whisper-status");

const testWhisperButton =
    document.querySelector("#test-whisper");

const transcript =
    document.querySelector("#transcript");

 const teachingNotes =
    document.querySelector("#teaching-notes");

let allTeachingFindings = [];   
// --------------------------------------------------
// Settings
// --------------------------------------------------

const CHUNK_SECONDS = 8;
const OVERLAP_SECONDS = 2;
const TARGET_SAMPLE_RATE = 16000;
const MAX_QUEUED_CHUNKS = 2;

// --------------------------------------------------
// App state
// --------------------------------------------------

let mediaStream = null;
let audioContext = null;
let sourceNode = null;
let analyser = null;
let workletNode = null;
let silentGainNode = null;

let animationFrameId = null;
let chunkTimer = null;

let isListening = false;
let whisperReady = false;
let workerBusy = false;

let capturedPieces = [];
let capturedSampleCount = 0;
let overlapTail = new Float32Array(0);
let sourceSampleRate = 48000;

let transcriptionQueue = [];
let activeJob = null;
let nextChunkId = 1;

let fullTranscript = "";

// --------------------------------------------------
// Whisper worker
// --------------------------------------------------

const transcriptionWorker = new Worker(
    new URL(
        "./ai/transcription-worker.js",
        import.meta.url
    ),
    {
        type: "module"
    }
);

transcriptionWorker.addEventListener(
    "message",
    handleWorkerMessage
);

transcriptionWorker.addEventListener(
    "error",
    (error) => {
        console.error(
            "Transcription worker error:",
            error
        );

        whisperStatus.textContent =
            "Whisper worker failed. Check the extension console.";

        loadWhisperButton.disabled = false;
        workerBusy = false;
    }
);

function handleWorkerMessage(event) {
    const message = event.data;

    if (!message || !message.type) {
        return;
    }

    if (message.type === "status") {
        whisperStatus.textContent =
            message.message;

        return;
    }

    if (message.type === "ready") {
        whisperReady = true;

        whisperStatus.textContent =
            "Whisper loaded successfully.";

        loadWhisperButton.disabled = true;
        testWhisperButton.disabled = false;

        if (isListening) {
            status.textContent =
                "Listening and transcribing tab audio";
        }

        return;
    }

    if (message.type === "result") {
        handleTranscriptionResult(
            message.chunkId,
            message.text
        );

        return;
    }

    if (message.type === "error") {
        console.error(
            `Whisper ${message.stage} error:`,
            message.message
        );

        if (message.stage === "load") {
            whisperReady = false;

            whisperStatus.textContent =
                "Whisper failed to load. Check the extension console.";

            loadWhisperButton.disabled = false;
        } else {
            status.textContent =
                "Listening, but one section could not be transcribed.";
        }

        workerBusy = false;
        activeJob = null;

        processNextTranscription();
    }
}

// --------------------------------------------------
// Load Whisper
// --------------------------------------------------

loadWhisperButton.addEventListener(
    "click",
    () => {
        if (whisperReady) {
            whisperStatus.textContent =
                "Whisper is already loaded.";

            return;
        }

        loadWhisperButton.disabled = true;

        whisperStatus.textContent =
            "Starting Whisper...";

        transcriptionWorker.postMessage({
            type: "load",
            wasmBaseUrl:
                chrome.runtime.getURL("wasm/")
        });
    }
);

// --------------------------------------------------
// Test transcription
// --------------------------------------------------

testWhisperButton.addEventListener(
    "click",
    runTestTranscription
);

async function runTestTranscription() {
    if (!whisperReady) {
        whisperStatus.textContent =
            "Load Whisper first.";

        return;
    }

    try {
        testWhisperButton.disabled = true;
        testWhisperButton.textContent =
            "Transcribing...";

        transcript.textContent =
            "Processing the test audio...";

        const response = await fetch(
            "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav"
        );

        if (!response.ok) {
            throw new Error(
                `Audio download failed: ${response.status}`
            );
        }

        const arrayBuffer =
            await response.arrayBuffer();

        const decodingContext =
            new AudioContext();

        const decodedAudio =
            await decodingContext.decodeAudioData(
                arrayBuffer.slice(0)
            );

        const sourceAudio =
            decodedAudio.getChannelData(0);

        const audio16k = downsampleAudio(
            sourceAudio,
            decodedAudio.sampleRate,
            TARGET_SAMPLE_RATE
        );

        await decodingContext.close();

        transcriptionQueue.push({
            id: nextChunkId++,
            kind: "test",
            audio: audio16k
        });

        processNextTranscription();
    } catch (error) {
        console.error(
            "Test transcription failed:",
            error
        );

        transcript.textContent =
            "Test transcription failed. Check the extension console.";

        testWhisperButton.disabled = false;
        testWhisperButton.textContent =
            "Try Again";
    }
}

// --------------------------------------------------
// Start and stop listening
// --------------------------------------------------

startBtn.addEventListener("click", () => {
    if (isListening) {
        stopListening();
        return;
    }

    startListening();
});

function startListening() {
    startBtn.disabled = true;

    status.textContent =
        "Connecting to this tab...";

    chrome.tabCapture.capture(
        {
            audio: true,
            video: false
        },
        async (stream) => {
            if (chrome.runtime.lastError) {
                showError(
                    chrome.runtime.lastError.message
                );

                return;
            }

            if (!stream) {
                showError(
                    "Chrome did not return an audio stream."
                );

                return;
            }

            try {
                mediaStream = stream;
                audioContext = new AudioContext();

                if (
                    audioContext.state ===
                    "suspended"
                ) {
                    await audioContext.resume();
                }

                sourceSampleRate =
                    audioContext.sampleRate;

                sourceNode =
                    audioContext
                        .createMediaStreamSource(
                            mediaStream
                        );

                analyser =
                    audioContext.createAnalyser();

                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant =
                    0.7;

                sourceNode.connect(analyser);

                // Keep the tab audio audible.
                sourceNode.connect(
                    audioContext.destination
                );

                await audioContext.audioWorklet
                    .addModule(
                        new URL(
                            "./audio/capture-worklet.js",
                            import.meta.url
                        )
                    );

                workletNode =
                    new AudioWorkletNode(
                        audioContext,
                        "capture-worklet"
                    );

                silentGainNode =
                    audioContext.createGain();

                silentGainNode.gain.value = 0;

                sourceNode.connect(workletNode);

                workletNode.connect(
                    silentGainNode
                );

                silentGainNode.connect(
                    audioContext.destination
                );

                workletNode.port.onmessage =
                    handleCapturedAudio;

                capturedPieces = [];
                capturedSampleCount = 0;
                overlapTail =
                    new Float32Array(0);

                transcriptionQueue = [];
                fullTranscript = "";

                isListening = true;

                startBtn.disabled = false;
                startBtn.textContent =
                    "Stop Listening";

                transcript.textContent =
                    whisperReady
                        ? "Listening for speech..."
                        : "Audio is connected. Load Whisper to begin transcription.";

                status.textContent =
                    whisperReady
                        ? "Listening and transcribing tab audio"
                        : "Listening to tab audio";

                chunkTimer = setInterval(
                    flushCapturedAudio,
                    CHUNK_SECONDS * 1000
                );

                measureAudioLevel();
            } catch (error) {
                showError(error.message);
            }
        }
    );
}

function stopListening() {
    if (!isListening) {
        return;
    }

    flushCapturedAudio();

    isListening = false;

    if (chunkTimer) {
        clearInterval(chunkTimer);
        chunkTimer = null;
    }

    if (animationFrameId) {
        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId = null;
    }

    if (workletNode) {
        workletNode.port.onmessage =
            null;

        workletNode.disconnect();
        workletNode = null;
    }

    if (silentGainNode) {
        silentGainNode.disconnect();
        silentGainNode = null;
    }

    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }

    if (mediaStream) {
        mediaStream
            .getTracks()
            .forEach((track) =>
                track.stop()
            );

        mediaStream = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    analyser = null;

    capturedPieces = [];
    capturedSampleCount = 0;
    overlapTail =
        new Float32Array(0);

    meterFill.style.width = "0%";
    levelText.textContent = "0%";

    status.textContent = "Ready";
    startBtn.textContent =
        "Start Listening";

    startBtn.disabled = false;
}

// --------------------------------------------------
// Continuous audio capture
// --------------------------------------------------

function handleCapturedAudio(event) {
    if (
        !isListening ||
        event.data?.type !== "audio"
    ) {
        return;
    }

    const samples =
        event.data.samples instanceof
        Float32Array
            ? event.data.samples
            : new Float32Array(
                event.data.samples
            );

    capturedPieces.push(samples);
    capturedSampleCount +=
        samples.length;
}

function flushCapturedAudio() {
    if (
        !whisperReady ||
        capturedSampleCount === 0
    ) {
        capturedPieces = [];
        capturedSampleCount = 0;

        return;
    }

    const newAudio = combineAudioPieces(
        capturedPieces,
        capturedSampleCount
    );

    capturedPieces = [];
    capturedSampleCount = 0;

    const combinedWithOverlap =
        concatenateAudio(
            overlapTail,
            newAudio
        );

    const overlapLength =
        Math.round(
            sourceSampleRate *
            OVERLAP_SECONDS
        );

    overlapTail =
        newAudio.length > overlapLength
            ? new Float32Array(
                newAudio.slice(
                    newAudio.length -
                    overlapLength
                )
            )
            : new Float32Array(
                newAudio
            );

    const audio16k = downsampleAudio(
        combinedWithOverlap,
        sourceSampleRate,
        TARGET_SAMPLE_RATE
    );

    if (isMostlySilent(audio16k)) {
        return;
    }

    transcriptionQueue.push({
        id: nextChunkId++,
        kind: "live",
        audio: audio16k
    });

    while (
        transcriptionQueue.length >
        MAX_QUEUED_CHUNKS
    ) {
        transcriptionQueue.shift();
    }

    processNextTranscription();
}

function combineAudioPieces(
    pieces,
    totalLength
) {
    const combined =
        new Float32Array(totalLength);

    let offset = 0;

    for (const piece of pieces) {
        combined.set(piece, offset);
        offset += piece.length;
    }

    return combined;
}

function concatenateAudio(
    first,
    second
) {
    const result =
        new Float32Array(
            first.length +
            second.length
        );

    result.set(first, 0);
    result.set(second, first.length);

    return result;
}

// --------------------------------------------------
// Resampling
// --------------------------------------------------

function downsampleAudio(
    audioData,
    originalSampleRate,
    targetSampleRate
) {
    if (
        originalSampleRate ===
        targetSampleRate
    ) {
        return new Float32Array(
            audioData
        );
    }

    const ratio =
        originalSampleRate /
        targetSampleRate;

    const newLength =
        Math.floor(
            audioData.length / ratio
        );

    const result =
        new Float32Array(newLength);

    for (
        let outputIndex = 0;
        outputIndex < newLength;
        outputIndex++
    ) {
        const sourceStart =
            Math.floor(
                outputIndex * ratio
            );

        const sourceEnd =
            Math.min(
                Math.floor(
                    (outputIndex + 1) *
                    ratio
                ),
                audioData.length
            );

        let total = 0;
        let count = 0;

        for (
            let sourceIndex =
                sourceStart;
            sourceIndex < sourceEnd;
            sourceIndex++
        ) {
            total +=
                audioData[sourceIndex];

            count++;
        }

        result[outputIndex] =
            count > 0
                ? total / count
                : 0;
    }

    return result;
}

function isMostlySilent(audio) {
    if (audio.length === 0) {
        return true;
    }

    let sumOfSquares = 0;

    for (const sample of audio) {
        sumOfSquares +=
            sample * sample;
    }

    const rms = Math.sqrt(
        sumOfSquares / audio.length
    );

    return rms < 0.003;
}

// --------------------------------------------------
// Transcription queue
// --------------------------------------------------

function processNextTranscription() {
    if (
        workerBusy ||
        !whisperReady ||
        transcriptionQueue.length === 0
    ) {
        return;
    }

    activeJob =
        transcriptionQueue.shift();

    workerBusy = true;

    if (activeJob.kind === "live") {
        status.textContent =
            "Transcribing recent audio...";
    }

    transcriptionWorker.postMessage(
        {
            type: "transcribe",
            chunkId: activeJob.id,
            audio: activeJob.audio
        },
        [activeJob.audio.buffer]
    );
}

function handleTranscriptionResult(
    chunkId,
    text
) {
    if (
        !activeJob ||
        activeJob.id !== chunkId
    ) {
        workerBusy = false;
        activeJob = null;
        processNextTranscription();

        return;
    }

    const finishedJob = activeJob;

    workerBusy = false;
    activeJob = null;

    const cleanText =
        String(text || "").trim();

    if (finishedJob.kind === "test") {
        transcript.textContent =
            cleanText ||
            "No speech was detected.";

        testWhisperButton.disabled =
            false;

        testWhisperButton.textContent =
            "Test Again";
} else if (cleanText) {
    const analysis =
        analyzeTranscriptChunk(cleanText);

    fullTranscript =
        mergeOverlappingText(
            fullTranscript,
            cleanText
        );

    transcript.textContent =
        fullTranscript;

    if (analysis.findings.length > 0) {
for (const finding of analysis.findings) {
    const alreadyExists = allTeachingFindings.some(
        (existingFinding) =>
            existingFinding.type === finding.type &&
            existingFinding.original.toLowerCase() ===
                finding.original.toLowerCase() &&
            existingFinding.correction.toLowerCase() ===
                finding.correction.toLowerCase()
    );

    if (!alreadyExists) {
        allTeachingFindings.push(finding);
    }
}

        renderTeachingNotes(
            allTeachingFindings,
            analysis.followUp
        );
    }
}

    if (isListening) {
        status.textContent =
            "Listening and transcribing tab audio";
    }

    processNextTranscription();
}

// --------------------------------------------------
// Remove repeated overlap text
// --------------------------------------------------

function mergeOverlappingText(existingText, newText) {
    if (!existingText) {
        return newText;
    }

    const existingWords = existingText.split(/\s+/);
    const newWords = newText.split(/\s+/);

    const maxOverlap = Math.min(
        30,
        existingWords.length,
        newWords.length
    );

    let bestOverlap = 0;
    let bestScore = 0;

    for (let overlap = maxOverlap; overlap >= 2; overlap--) {
        const existingEnding = existingWords.slice(-overlap);
        const newBeginning = newWords.slice(0, overlap);

        let matches = 0;

        for (let index = 0; index < overlap; index++) {
            const existingWord = normalizeWord(existingEnding[index]);
            const newWord = normalizeWord(newBeginning[index]);

            if (existingWord === newWord) {
                matches++;
            }
        }

        const score = matches / overlap;

        if (score > bestScore) {
            bestScore = score;
            bestOverlap = overlap;
        }

        if (score >= 0.75) {
            const remainingWords = newWords.slice(overlap);

            return remainingWords.length
                ? `${existingText} ${remainingWords.join(" ")}`
                : existingText;
        }
    }

    // Handle cases where Whisper slightly rewrites the overlap.
    if (bestScore >= 0.6 && bestOverlap >= 4) {
        const remainingWords = newWords.slice(bestOverlap);

        return remainingWords.length
            ? `${existingText} ${remainingWords.join(" ")}`
            : existingText;
    }

    return `${existingText} ${newText}`;
}

function normalizeWord(word) {
    return word
        .toLowerCase()
        .replace(
            /[^a-z0-9']/g,
            ""
        );
}

// --------------------------------------------------
// Audio meter
// --------------------------------------------------

function measureAudioLevel() {
    if (!analyser || !isListening) {
        return;
    }

    const samples =
        new Uint8Array(
            analyser.fftSize
        );

    analyser.getByteTimeDomainData(
        samples
    );

    let sumOfSquares = 0;

    for (const sample of samples) {
        const normalized =
            (sample - 128) / 128;

        sumOfSquares +=
            normalized * normalized;
    }

    const rms = Math.sqrt(
        sumOfSquares /
        samples.length
    );

    const level = Math.min(
        100,
        Math.round(rms * 500)
    );

    meterFill.style.width =
        `${level}%`;

    levelText.textContent =
        `${level}%`;

    animationFrameId =
        requestAnimationFrame(
            measureAudioLevel
        );
}

// --------------------------------------------------
// Errors
// --------------------------------------------------

function showError(message) {
    console.error(message);

    isListening = false;

    startBtn.disabled = false;
    startBtn.textContent =
        "Try Again";

    status.textContent = message;
}

function renderTeachingNotes(findings, followUp) {
    const recentFindings =
        findings.slice(-6);

    teachingNotes.innerHTML = "";

    for (const finding of recentFindings) {
        const note =
            document.createElement("div");

        note.className =
            "teaching-note";

        note.innerHTML = `
            <strong>${finding.type}</strong>
            <p>
                Student said:
                “${finding.original}”
            </p>
            <p>
                Try:
                “${finding.correction}”
            </p>
            <p>
                ${finding.explanation}
            </p>
        `;

        teachingNotes.appendChild(note);
    }

    if (followUp) {
        const question =
            document.createElement("div");

        question.className =
            "teaching-note";

        question.innerHTML = `
            <strong>Possible follow-up</strong>
            <p>${followUp}</p>
        `;

        teachingNotes.appendChild(question);
    }
}