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
      if (ev.data.type === "sysex") {
        this.sysex(ev.data.bytes);
      } else {
        this.midiInput.push(ev.data);
      }
    });

    this.port.start();
    console.log("dx7 started");
  }

  sysex(bytes: Uint8Array) {
    // 4096 or 4104 bytes
    // https://www.muzines.co.uk/articles/everything-you-ever-wanted-to-know-about-system-exclusive/5722
    // $FO start of System Exclusive
    // $43 Yamaha Identification
    // $00 Sub-status and channel (ssss nnnn, where n = MIDI channel)
    // $09 Format number
    // $20 Byte count MSB
    // $00 Byte count LSB ($2000 = 4096)
    // ... firstdata byte
    // ...
    // ... last data byte
    // $XX checksum of data bytes
    // $F7 end of System Exclusive
    let offset = 0;
    if (bytes.length === 4104) {
      offset = 6;
      // TODO: validate first bytes are F0, 43, 00, 09, 20, 00
    } else if (bytes.length !== 4096) {
      throw new Error("Expected sysex of 4096 or 4104 byes");
    }

    for (let i = 0; i < 4096; i++) {
      this.synthUnit.patch_data_[i] = bytes[i + offset];
    }

    this.synthUnit.ProgramChange(0);
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
