class CaptureWorkletProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];

        if (!input || input.length === 0) {
            return true;
        }

        const firstChannel = input[0];

        if (!firstChannel) {
            return true;
        }

        // Copy the samples because the browser reuses its audio buffers.
        const samples = new Float32Array(firstChannel);

        this.port.postMessage(
            {
                type: "audio",
                samples
            },
            [samples.buffer]
        );

        return true;
    }
}

registerProcessor(
    "capture-worklet",
    CaptureWorkletProcessor
);