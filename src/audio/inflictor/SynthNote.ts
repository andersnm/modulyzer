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

  isPlaying: boolean = false;
  releaseTimeout = null;

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

    if (this.releaseTimeout) {
      clearTimeout(this.releaseTimeout);
      this.releaseTimeout = null;
    }

    const freq = noteToFreq(note);
    this.osc1.oscillator.frequency.setValueAtTime(freq, time);
    this.osc2.oscillator.frequency.setValueAtTime(freq, time);
    this.ampEnvelope.trigger(time);
    this.isPlaying = true;
  }

  releaseNote(time: number) {
    this.ampEnvelope.untrigger(time);

    // TODO: do this differently, set releaseTime and compare in voice allocation
    this.releaseTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.releaseTimeout = null;
    }, ((time - this.context.currentTime) + this.ampEnvelope.release) * 1000);
  }
}
