import { linToExp, linToLin } from "./Functions";
import { Open303 } from "./Open303";
import { parameterDescriptors } from "./Open303Parameters";

interface MidiMessage {
    time: number;
    command: number;
    value: number;
    data: number;
}

class Open303Processor extends AudioWorkletProcessor {
  synthUnit: Open303;
  midiInput: MidiMessage[] = [];
  quit: boolean = false;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return parameterDescriptors;
  }

  constructor() {
    super();

    this.synthUnit = new Open303();
    this.synthUnit.setSampleRate(sampleRate);
    this.synthUnit.setCutoff(500);
    this.synthUnit.setResonance(50);
    this.synthUnit.setEnvMod(0.25)
    this.synthUnit.setDecay(400)

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

    this.synthUnit.setCutoff(parameters["cutoff"][0]);
    this.synthUnit.setResonance(parameters["resonance"][0]);
    this.synthUnit.setEnvMod(parameters["envMod"][0]);
    this.synthUnit.setWaveform(parameters["waveform"][0]);
    this.synthUnit.setDecay(parameters["decay"][0]);
    this.synthUnit.setAccentDecay(parameters["decay"][0]);
    this.synthUnit.setAccent(parameters["accent"][0]);

    const outputSamples = outputs[0][0].length;
    const outputTime = outputs[0][0].length / sampleRate;
    const ct = currentTime;

    for (let i = 0; i < this.midiInput.length; ) {
      const midiMessage = this.midiInput[i];

      // find the event with the shortest time until trigger in this block
      if (midiMessage.time < ct || midiMessage.time <= ct + outputTime) {
        this.processMidiMessage(midiMessage);
        this.midiInput.splice(i, 1);
      } else {
        i++;
      }
    }

    for (let n = 0; n < outputSamples; n++) {
      outputs[0][0][n] = this.synthUnit.getSample();
    }

    return true;
  }

  processMidiMessage(midiMessage: MidiMessage) {
    switch (midiMessage.command) {
      case 0x90:
        if (midiMessage.data !== 0) {
          // console.log("303 note on", midiMessage)
          this.synthUnit.noteOn(midiMessage.value, midiMessage.data, 0);
        } else {
          // console.log("303 note off (0x90)")
          this.synthUnit.noteOn(midiMessage.value, 0, 0);
        }
        break;
      case 0x80:
        // console.log("303 note off (0x80)")
        this.synthUnit.noteOn(midiMessage.value, 0, 0);
        break;
      case 0xB0:
        switch (midiMessage.value) {
          case 0x7b:
            console.log("All Notes off", this.midiInput)
            this.midiInput.length = 0;
            this.synthUnit.allNotesOff();
            break;
        }
        break;
      }
  }
}

registerProcessor("open303", Open303Processor);
