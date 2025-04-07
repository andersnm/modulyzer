class RecordProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    // inputs: An array of inputs connected to the node, each item of which is, in turn, an array of channels. 
    if (!inputs.length) {
      return true;
    }

    // Send all channels from the first input, assume only a microphone stream is connected
    const inputBuffers = inputs[0];
    this.port.postMessage(inputBuffers);
    return true;
  }
}

registerProcessor("record-processor", RecordProcessor);
