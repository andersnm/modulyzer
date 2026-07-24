class SynthOscillatorVoice {
  osc: OscillatorNode;
  voiceDetune: number;
}

export class SynthOscillator {
  oscillators: SynthOscillatorVoice[] = [];
  lfo: OscillatorNode | null = null;

  oscType: OscillatorType = "sawtooth";
  oscDetune: number = 0;
  oscGain: number = 0.5;
  lfoFreq: number = 0.3;
  unisonVoices: number = 3;
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
    this.lfo = this.context.createOscillator();
    this.lfo.frequency.value = this.lfoFreq;

    this.lfo.connect(this.lfoGain);

    for (let i = 0; i < this.unisonVoices; i++) {
      const osc = this.context.createOscillator();
      osc.type = this.oscType;

      const fraction = (this.unisonVoices === 1) ? 0 : (i / (this.unisonVoices - 1)) - 0.5;
      let voiceDetune = fraction * 12;

      if (this.oscDetune < 0)
        voiceDetune *= -1;

      osc.detune.setValueAtTime(voiceDetune + this.oscDetune, time);
      this.lfoGain.connect(osc.detune);
      osc.frequency.setValueAtTime(freq, time);
      osc.connect(this.gainNode);
      osc.start(time);

      this.oscillators.push({ osc, voiceDetune });
    }

    this.lfo.start(time);

    const voiceCompensation = 1 / this.unisonVoices; // Math.sqrt(this.unisonVoices);
    this.gainNode.gain.setValueAtTime(this.oscGain * voiceCompensation, time);
  }

  stop(time: number) {
    for (let osc of this.oscillators) {
      osc.osc.stop(time);
    }
    this.oscillators = [];
    if (this.lfo) {
      this.lfo.stop(time);
      this.lfo = null;
    }
  }
  

  setOscType(type: OscillatorType) {
    this.oscType = type;
    for (let osc of this.oscillators) {
      osc.osc.type = type;
    }
  }

  setOscDetune(time: number, value: number) {
    this.oscDetune = value;
    for (let osc of this.oscillators) {
      osc.osc.detune.setValueAtTime(osc.voiceDetune + this.oscDetune, time);
    }
  }

  setLfoFreq(value: number) {
    this.lfoFreq = value;
    if (this.lfo) {
      this.lfo.frequency.setValueAtTime(value, this.context.currentTime);
    }
  }

  setOscGain(time: number, value: number) {
    this.oscGain = value;

    const voiceCompensation = 1 / this.unisonVoices; // Math.sqrt(this.unisonVoices);
    this.gainNode.gain.setValueAtTime(value * voiceCompensation, time);
  }
}
