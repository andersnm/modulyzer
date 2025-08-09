import { parameterDescriptors } from "./Dx7Parameters";
import { SynthUnit } from "./SynthUnit";

interface MidiMessage {
    time: number;
    command: number;
    value: number;
    data: number;
}

class Dx7Processor extends AudioWorkletProcessor {
  synthUnit: SynthUnit;
  midiInput: MidiMessage[] = [];
  quit: boolean = false;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return parameterDescriptors;
  }

  constructor() {
    super();

    SynthUnit.Init(sampleRate);

    this.synthUnit = new SynthUnit();

    this.port.addEventListener("message", (ev) => {
      if (ev.data.type === "midi") {
        this.midiInput.push(ev.data);
      } else if (ev.data.type === "quit") {
        this.quit = true;
      } else {
        throw new Error("Unknown message: " + ev.data.type);
      }
    });

    this.port.start();
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    if (this.quit) {
      this.port.close();
      return false;
    }

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
        this.processMidi(buf[0], buf[1], buf[2], parameters);
        this.midiInput.splice(i, 1);
      } else {
        i++;
      }
    }

    this.synthUnit.GetSamples(outputSamples, outputs[0][0]);

    return true;
  }

  processMidi(command: number, value: number, data0: number, parameters: Record<string, Float32Array>) {
    switch (command) {
      case 0x90:
        if (data0 === 0) {
          this.synthUnit.noteOff(value);
        } else {
          this.synthUnit.parsed_patch.setFromParameters(parameters);
          this.synthUnit.noteOn(value, data0);
        }
        break;
      case 0x80:
        this.synthUnit.noteOff(value);
        break;
    }
  }
}

registerProcessor("dx7", Dx7Processor);
