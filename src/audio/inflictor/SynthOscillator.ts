export class SynthOscillator {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;

  constructor(context: AudioContext) {
    this.oscillator = context.createOscillator();
    this.oscillator.type = "sawtooth";
    this.oscillator.detune.value = 0;

    this.gainNode = context.createGain();
    this.gainNode.gain.value = 0.5;

    this.lfo = context.createOscillator();
    this.lfo.frequency.value = 0.3;
    this.lfoGain = context.createGain();
    this.lfoGain.gain.value = 10;

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.oscillator.detune);

    this.oscillator.connect(this.gainNode);

    this.oscillator.start();
    this.lfo.start();
  }

  connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }
}
