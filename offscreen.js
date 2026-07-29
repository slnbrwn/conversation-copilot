let mediaStream = null;
let audioContext = null;
let analyser = null;
let animationFrameId = null;

chrome.runtime.onMessage.addListener((message) => {
    if (
        message.target === "offscreen" &&
        message.type === "START_CAPTURE"
    ) {
        startCapture(message.streamId).catch((error) => {
            console.error("Could not start audio capture:", error);

            chrome.runtime.sendMessage({
                type: "CAPTURE_ERROR",
                error: error.message
            });
        });
    }
});

async function startCapture(streamId) {
    stopCapture();

    mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource: "tab",
                chromeMediaSourceId: streamId
            }
        },
        video: false
    });

    audioContext = new AudioContext();

    const source = audioContext.createMediaStreamSource(mediaStream);

    // Keep the lesson audio audible after Chrome begins capturing it.
    source.connect(audioContext.destination);

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);

    chrome.runtime.sendMessage({
        type: "CAPTURE_STARTED"
    });

    measureAudioLevel();
}

function measureAudioLevel() {
    if (!analyser) {
        return;
    }

    const samples = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(samples);

    let sumOfSquares = 0;

    for (const sample of samples) {
        const normalizedSample = (sample - 128) / 128;
        sumOfSquares += normalizedSample * normalizedSample;
    }

    const rms = Math.sqrt(sumOfSquares / samples.length);
    const level = Math.min(100, Math.round(rms * 350));

    chrome.runtime.sendMessage({
        type: "AUDIO_LEVEL",
        level
    });

    animationFrameId = requestAnimationFrame(measureAudioLevel);
}

function stopCapture() {
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
}