import { ADSREnvelope } from "./ADSREnvelope";
import { SynthFilter } from "./SynthFilter";
import { SynthOscillator } from "./SynthOscillator";

function noteToFreq(note) {
  let a = 440; //frequency of A (coomon value is 440Hz)
  return (a / 32) * (2 ** ((note - 9) / 12));
}

export class SynthNote {
  private context: AudioContext;
  osc1: SynthOscillator;
  osc2: SynthOscillator;
  filter: SynthFilter;
  ampGain: GainNode;
  ampEnvelope: ADSREnvelope;

  isActive = false;
  noteOnTime = 0;
  noteOffTime = null;
  releaseEndTime = null;
  note = -1;

  constructor(context: AudioContext) {

    this.context = context;

    this.osc1 = new SynthOscillator(this.context);
    this.osc2 = new SynthOscillator(this.context);
    this.filter = new SynthFilter(this.context);
    this.ampGain = this.context.createGain();
    this.ampEnvelope = new ADSREnvelope(this.ampGain.gain);

    this.osc1.connect(this.filter.input);
    this.osc2.connect(this.filter.input);
    this.filter.connect(this.ampGain);
  }

  triggerNote(time: number, note: number, velocity: number) {
    this.note = note;
    this.noteOnTime = time;
    this.noteOffTime = null;
    this.releaseEndTime = null;
    this.isActive = true;

    const freq = noteToFreq(note);
    this.osc1.play(time, freq);
    this.osc2.play(time, freq);
    this.ampEnvelope.trigger(time);
  }

  releaseNote(time: number) {
    this.noteOffTime = time;
    this.releaseEndTime = time + this.ampEnvelope.release;

    this.ampEnvelope.untrigger(time);
    this.osc1.stop(this.releaseEndTime);
    this.osc2.stop(this.releaseEndTime);
  }

  clearNote() {
    this.isActive = false;
    this.note = -1;
    this.osc1.oscillator = null;
    this.osc2.oscillator = null;
    this.osc1.lfo = null;
    this.osc2.lfo = null;
  }

  isFinished(now: number) {
    return this.releaseEndTime !== null && now >= this.releaseEndTime;
  }
}
