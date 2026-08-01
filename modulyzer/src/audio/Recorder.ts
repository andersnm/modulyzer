/*
v1. allocated Float32Array all the time
v2. used SharedArrayBuffer, deep rabbithole of cross-origin-isolation
v3. uses transferable ArrayBuffer pool
*/

const bufferSize = 8192 * 4; // number of samples per buffer in the pool - must be multiple of 128

export class Recorder extends EventTarget {
    context: AudioContext;
    recordNode: AudioWorkletNode;
    buffers: Float32Array[];

    constructor(context: AudioContext) {
        super();
        this.context = context;

        const bufferPool: ArrayBuffer[] = [];
        for (let i = 0; i < 16; i++) {
            bufferPool.push(new ArrayBuffer(bufferSize * Float32Array.BYTES_PER_ELEMENT));
        }

        this.recordNode = new AudioWorkletNode(this.context, "record-processor");
        this.recordNode.port.addEventListener("message", this.onMessage);
        this.recordNode.connect(context.destination);

        this.recordNode.port.start();
        this.recordNode.port.postMessage({ type: "init", buffers: bufferPool });
    }

    onMessage = (ev: MessageEvent<{type, buffers}>) => {
        if (ev.data.type === "input") {
            const left = new Float32Array(ev.data.buffers[0]);
            const right = new Float32Array(ev.data.buffers[1]);
            this.dispatchEvent(new CustomEvent("input", { detail: [ left, right ] }));
            this.recordNode.port.postMessage({ type: "recycle", buffers: ev.data.buffers }, ev.data.buffers);
        }
    };

    destroy() {
        this.recordNode.port.postMessage({ type: "quit" });
    }
}
