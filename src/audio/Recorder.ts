export interface RecorderBuffer {
    buffer: Float32Array;
    bufferPosition: number;
}

const bufferSize = 8192 * 4;

function createBuffers() {
    return [
        new Float32Array(bufferSize),
        new Float32Array(bufferSize)
    ];
}

export class Recorder extends EventTarget {
    context: AudioContext;
    recordNode: AudioWorkletNode;

    constructor(context: AudioContext) {
        super();
        this.context = context;

        this.recordNode = this.setupRecordNode();

        this.recordNode.connect(context.destination);
    }

    setupRecordNode() {
        const recordNode = new AudioWorkletNode(this.context, "record-processor");

        let buffers = createBuffers();
        let bufferPosition = 0;

        recordNode.port.onmessage = async (e) => {
            // always monitoring, discard unless recording
            const inputs: Float32Array[] = e.data;
            const inputLength = inputs[0].length;
            if (inputLength > bufferSize) {
                throw new Error("Recorder buffer size too small");
            }

            let remaining = inputLength;
            let inputPosition = 0;
            while (remaining > 0) {
                const chunkSize = Math.min(bufferSize - bufferPosition, remaining);

                for (let i = 0; i < buffers.length; i++) {
                    buffers[i].set(inputs[i % inputs.length].subarray(inputPosition, inputPosition + chunkSize), bufferPosition);
                }

                inputPosition += chunkSize;

                if (bufferPosition === bufferSize) {
                    // EOC - end of chunk, go for it
                    this.dispatchEvent(new CustomEvent("input", { detail: buffers }))

                    buffers = createBuffers();
                    bufferPosition = 0;
                    remaining -= chunkSize;
                } else {
                    bufferPosition += chunkSize;
                    remaining -= chunkSize;
                }
            }

        };

        return recordNode;
    }
}
