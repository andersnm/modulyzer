import { SynthUnit } from "./SynthUnit";

interface MidiMessage {
    time: number;
    command: number;
    value: number;
    data: number;
}

let counter = 0;

class Dx7Processor extends AudioWorkletProcessor {
  synthUnit: SynthUnit;

  midiInput: MidiMessage[] = [];

  constructor() {
    super();

    SynthUnit.Init(sampleRate);

    console.log("dx7 inits");
    this.synthUnit = new SynthUnit();

    // currentTime;
    this.port.addEventListener("message", (ev) => {
      // schedule midi messages with timestamp
      // console.log("dx7 got midi", ev);
      this.midiInput.push(ev.data);
    });

    this.port.start();
    console.log("dx7 started");
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    if (!outputs.length || !outputs[0].length) {
      return true;
    }

    const outputSamples = outputs[0][0].length;
    const outputTime = outputs[0][0].length / sampleRate;
    const ct = currentTime;

    for (let i = 0; i < this.midiInput.length; ) {
      const midiMessage = this.midiInput[i];

      // find the event with the shortest time until trigger in this block
      if (midiMessage.time < ct || midiMessage.time <= ct + outputTime) {
        const buf = [midiMessage.command, midiMessage.value, midiMessage.data ];
        this.synthUnit.ProcessMidiMessage(buf, 3);
        this.midiInput.splice(i, 1);
      } else {
        i++;
      }
    }

    this.synthUnit.GetSamples(outputSamples, outputs[0][0]);
    counter++

    return true;
  }
}

registerProcessor("dx7", Dx7Processor);
