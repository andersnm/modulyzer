export interface RecorderBuffer {
    buffer: Float32Array;
    bufferPosition: number;
}

const bufferSize = 8192 * 4; // size of the shared ringbuffer
const outputSize = bufferSize / 4; // return quarter chunks of the ringbuffer as they're ready

export class Recorder extends EventTarget {
    context: AudioContext;
    recordNode: AudioWorkletNode;
    sharedState: SharedArrayBuffer;
    sharedBuffers: SharedArrayBuffer[];
    buffers: Float32Array[];
    state: Int32Array;
    pollingInterval: number;
    lastReadPosition: number = 0;
    outBuffers: Float32Array[];

    constructor(context: AudioContext) {
        super();
        this.context = context;

        this.sharedState = new SharedArrayBuffer(16); // write, 3 reserved * sizeof(int32)
        this.sharedBuffers = [
            new SharedArrayBuffer(bufferSize * 4), // * sizeof(float)
            new SharedArrayBuffer(bufferSize * 4)
        ];

        this.state = new Int32Array(this.sharedState);
        this.buffers = [
            new Float32Array(this.sharedBuffers[0]),
            new Float32Array(this.sharedBuffers[1]),
        ];

        this.outBuffers = [
            new Float32Array(outputSize),
            new Float32Array(outputSize)
        ];

        this.recordNode = new AudioWorkletNode(this.context, "record-processor");
        this.recordNode.port.postMessage({ type: "init", buffers: this.sharedBuffers, state: this.sharedState });
        this.recordNode.connect(context.destination);

        // TODO: compute a poll interval such that a quarter of the ringbuffer is always ready
        this.pollingInterval = window.setInterval(this.onPoll, 90);
    }

    onPoll = () => {
        const writePosition = Atomics.load(this.state, 0);
        const available = (writePosition >= this.lastReadPosition)
            ? writePosition - this.lastReadPosition
            : bufferSize - this.lastReadPosition + writePosition;

        if (available < outputSize) return; // wait until enough data

        const left = this.buffers[0].subarray(this.lastReadPosition, this.lastReadPosition + outputSize);
        const right = this.buffers[1].subarray(this.lastReadPosition, this.lastReadPosition + outputSize);

        this.lastReadPosition += outputSize;

        this.dispatchEvent(new CustomEvent("input", {
            detail: [left, right]
        }));
    }

    destroy() {
        this.recordNode.port.postMessage({ type: "quit" });
        clearInterval(this.pollingInterval);
        this.pollingInterval = undefined;
    }
}
