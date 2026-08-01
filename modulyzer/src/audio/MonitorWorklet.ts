class MonitorProcessor extends AudioWorkletProcessor {
  private active: boolean = false;

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const sample = input[0]?.[0] ?? 0;
    const isActive = sample !== 0;

    if (isActive !== this.active) {
      this.active = isActive;
      this.port.postMessage(isActive);
    }

    return true;
  }
}

registerProcessor("monitor-processor", MonitorProcessor);
