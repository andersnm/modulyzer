class RecordProcessor extends AudioWorkletProcessor {
  quit: boolean = false;
  arrayBufferPool: ArrayBuffer[] = [];

  buffers: Float32Array[];
  arrayBuffers: ArrayBuffer[];
  writePosition: number = 0;

  constructor() {
    super();

    this.port.addEventListener("message", this.onMessage);
    this.port.start();
  }

  allocateBuffers(bufferCount: number = 2) {
    if (this.arrayBufferPool.length < bufferCount) {
      throw new Error("Out of buffers in pool");
    }

    return this.arrayBufferPool.splice(0, bufferCount);
  }

  postBuffers() {
    this.port.postMessage({ type: "input", buffers: this.arrayBuffers }, this.arrayBuffers); 
    this.arrayBuffers = this.allocateBuffers(2); 
    this.buffers = [ new Float32Array(this.arrayBuffers[0]), new Float32Array(this.arrayBuffers[1]) ];
  }

  onMessage = (ev: MessageEvent<{type, buffers}>) => {
    if (ev.data.type === "init") {
      this.arrayBufferPool = ev.data.buffers;
      this.arrayBuffers = this.allocateBuffers(2); 
      this.buffers = [ new Float32Array(this.arrayBuffers[0]), new Float32Array(this.arrayBuffers[1]) ];
    } else if (ev.data.type === "recycle") {
      this.arrayBufferPool.push(...ev.data.buffers);
    } else if (ev.data.type === "quit") {
      this.quit = true;
    } else {
      console.error("Unknown message: " + ev.data.type);
    }
  };

  process(inputs: Float32Array[][], outputs, parameters) {
    if (this.quit) {
      return false;
    }

    if (!this.buffers) {
      return true;
    }

    if (!inputs.length) {
      return true;
    }

    // Send all channels from the first input, assume only a microphone stream is connected
    const inputBuffers = inputs[0];
    const inputBufferSize = inputBuffers[0].length;
    const recordBufferSize = this.buffers[0].length;

    if (this.writePosition + inputBufferSize > recordBufferSize) {
      throw new Error("Input buffer too large for record buffer - should never happen");
    }

    this.buffers[0].set(inputBuffers[0], this.writePosition);
    this.buffers[1].set(inputBuffers[1], this.writePosition);

    if (this.writePosition + inputBufferSize === recordBufferSize) {
      this.postBuffers();
    }

    this.writePosition = (this.writePosition + inputBufferSize) % recordBufferSize;

    return true;
  }
}

registerProcessor("record-processor", RecordProcessor);
