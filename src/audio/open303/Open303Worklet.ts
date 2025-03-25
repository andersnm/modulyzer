import { Open303 } from "./Open303";

interface MidiMessage {
    time: number;
    command: number;
    value: number;
    data: number;
}

class Open303Processor extends AudioWorkletProcessor {
  synthUnit: Open303;

  midiInput: MidiMessage[] = [];

  constructor() {
    super();

    console.log("303 inits");
    this.synthUnit = new Open303();
    this.synthUnit.setCutoff(500); // expToLin( 500.0,  314.0,  2394.0, 0.0,  1.0);
    this.synthUnit.setResonance(50); // linToLin(  50.0,    0.0,   100.0, 0.0,  1.0);
    this.synthUnit.setEnvMod(0.25)
    this.synthUnit.setDecay(400)

    this.port.addEventListener("message", (ev) => {
      // schedule midi messages with timestamp
      this.midiInput.push(ev.data);
    });

    this.port.start();
    console.log("303 started");
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
    console.log(midiMessage)
    switch (midiMessage.command) {
      case 0x90:
        if (midiMessage.data !== 0) {
          console.log("303 note on", midiMessage)
          this.synthUnit.noteOn(midiMessage.value, midiMessage.data, 0);
        } else {
          console.log("303 note off (0x90)")
          this.synthUnit.noteOn(midiMessage.value, 0, 0);
          // this.synthUnit.releaseNote(midiMessage.value);
        }
        break;
      case 0x80:
        console.log("303 note off (0x80)")
        this.synthUnit.noteOn(midiMessage.value, 0, 0);
        // this.synthUnit.releaseNote(midiMessage.value);
        break;
      }
  }
}

registerProcessor("open303", Open303Processor);
