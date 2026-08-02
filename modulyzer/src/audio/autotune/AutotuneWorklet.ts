import { PitchShift } from "./PitchShift";

export interface MidiMessage {
  time: number;
  command: number;
  value: number;
  data: number;
}

export interface WorkletMessage {
  type: "midi" | "quit";
  command?: number;
  value?: number;
  data?: number;
  time?: number;
}

class AutotuneProcessor extends AudioWorkletProcessor {
  private midiInput: MidiMessage[] = [];
  private quit = false;
  private targetFrequency = 0;

  private readonly outBufferSize = 16384;
  private outputRingBuffer = new Float32Array(this.outBufferSize);
  private outWritePos = 0;
  private outReadPos = 0;
  private outBufferedSamples = 0;

  private pitchShifter: PitchShift;

  constructor() {
    super();

    this.pitchShifter = new PitchShift(
      (frame: Float32Array | number[]) => {
        for (let i = 0; i < frame.length; i++) {
          this.outputRingBuffer[this.outWritePos] = frame[i];
          this.outWritePos = (this.outWritePos + 1) % this.outBufferSize;
        }
        this.outBufferedSamples += frame.length;
      },
      (_time: number, _pitch: number): number => {

        if (_pitch < 20) {
          return 1;
        }

        let targetFrequency = this.targetFrequency;

        if (targetFrequency <= 0) {
          const midiNote = Math.round(69 + 12 * Math.log2(_pitch / 440));
          targetFrequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        }

        // Ratio = target / detected
        const ratio = targetFrequency / _pitch;

        // Clamp extreme pitch shifts (0.5x to 2.0x / +-12 semitones)
        return Math.min(Math.max(ratio, 0.5), 2.0);
      },
      { frameSize: 1024, hopSize: 128, sampleRate });

    this.port.addEventListener("message", (ev: MessageEvent<WorkletMessage>) => {
      if (ev.data.type === "midi") {
        this.midiInput.push(ev.data as MidiMessage);
      } else if (ev.data.type === "quit") {
        this.quit = true;
      }
    });

    this.port.start();
  }

  private processMidi(): void {
    while (this.midiInput.length > 0) {
      const msg = this.midiInput.shift();
      switch (msg.command) {
        case 0x90:
          if (msg.data !== 0) {
            this.targetFrequency = 440.0 * Math.pow(2, (msg.value - 69) / 12);
          } else {
            this.targetFrequency = 0;
          }
          break;
        case 0x80:
          this.targetFrequency = 0;
          break;
      }
    }
  }

  public process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    if (this.quit) return false;

    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || input[0].length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    this.processMidi();

    this.pitchShifter.push(inputChannel);

    for (let i = 0; i < outputChannel.length; i++) {
      if (this.outBufferedSamples > 0) {
        outputChannel[i] = this.outputRingBuffer[this.outReadPos];
        this.outReadPos = (this.outReadPos + 1) % this.outBufferSize;
        this.outBufferedSamples--;
      } else {
        outputChannel[i] = inputChannel[i];
      }
    }

    for (let c = 1; c < output.length; c++) {
      output[c].set(outputChannel);
    }

    return true;
  }
}

registerProcessor("autotune", AutotuneProcessor);
