export class SynthOscillator {
  oscillator: OscillatorNode | null = null;
  lfo: OscillatorNode | null = null;

  oscType: OscillatorType = "sawtooth";
  oscDetune: number = 0;
  lfoFreq: number = 0.3;
  gainNode: GainNode;
  lfoGain: GainNode;

  constructor(private context: AudioContext) {
    this.gainNode = context.createGain();
    this.gainNode.gain.value = 0.5;

    this.lfoGain = context.createGain();
    this.lfoGain.gain.value = 10;
  }

  connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }

  play(time: number, freq: number) {
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = this.oscType;
    this.oscillator.detune.value = this.oscDetune;

    this.lfo = this.context.createOscillator();
    this.lfo.frequency.value = this.lfoFreq;

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.oscillator.detune);

    this.oscillator.connect(this.gainNode);

    this.oscillator.start(time);
    this.lfo.start(time);

    this.oscillator.frequency.setValueAtTime(freq, time);
  }

  stop(time: number) {
    if (this.oscillator) {
      this.oscillator.stop(time);
      this.oscillator = null;
    }
    if (this.lfo) {
      this.lfo.stop(time);
      this.lfo = null;
    }
  }
  

  setOscType(type: OscillatorType) {
    this.oscType = type;
    if (this.oscillator) {
      this.oscillator.type = type;
    }
  }

  setOscDetune(value: number) {
    this.oscDetune = value;
    if (this.oscillator) {
      this.oscillator.detune.setValueAtTime(value, this.context.currentTime);
    }
  }

  setLfoFreq(value: number) {
    this.lfoFreq = value;
    if (this.lfo) {
      this.lfo.frequency.setValueAtTime(value, this.context.currentTime);
    }
  }

}
