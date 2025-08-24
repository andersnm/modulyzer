class RecordProcessor extends AudioWorkletProcessor {
  quit: boolean = false;
  buffers: Float32Array[];
  state: Int32Array;

  constructor() {
    super();

    this.port.addEventListener("message", this.onMessage);
    this.port.start();
  }

  onMessage = (ev: MessageEvent<any>) => {
    if (ev.data.type === "init") {
      this.buffers = [
        new Float32Array(ev.data.buffers[0]),
        new Float32Array(ev.data.buffers[1]),
      ];
      this.state = new Int32Array(ev.data.state);
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

    if (!this.buffers || !this.state) {
      return true;
    }

    if (!inputs.length) {
      return true;
    }

    let writePosition = Atomics.load(this.state, 0);

    // Send all channels from the first input, assume only a microphone stream is connected
    const inputBuffers = inputs[0];
    const inputBufferSize = inputBuffers[0].length;
    const recordBufferSize = this.buffers[0].length;

    if (writePosition + inputBufferSize <= recordBufferSize) {
      this.buffers[0].set(inputBuffers[0], writePosition);
      this.buffers[1].set(inputBuffers[1], writePosition);
    } else {
      // wrap
      const chunkSize = recordBufferSize - writePosition;
      this.buffers[0].set(inputBuffers[0].subarray(0, chunkSize), writePosition);
      this.buffers[1].set(inputBuffers[1].subarray(0, chunkSize), writePosition);

      this.buffers[0].set(inputBuffers[0].subarray(chunkSize, inputBufferSize), 0);
      this.buffers[1].set(inputBuffers[1].subarray(chunkSize, inputBufferSize), 0);
    }

    writePosition = (writePosition + inputBufferSize) % recordBufferSize;
    Atomics.store(this.state, 0, writePosition);

    return true;
  }
}

registerProcessor("record-processor", RecordProcessor);
