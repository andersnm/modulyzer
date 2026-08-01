export class SynthFilter {
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;

  constructor(context: AudioContext) {
    this.filter = context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 1;

    this.lfo = context.createOscillator();
    this.lfo.frequency.value = 0.1;
    this.lfoGain = context.createGain();
    this.lfoGain.gain.value = 50;

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);

    this.lfo.start();
  }

  connect(destination: AudioNode) {
    this.filter.connect(destination);
  }

  get input() {
    return this.filter;
  }
}
