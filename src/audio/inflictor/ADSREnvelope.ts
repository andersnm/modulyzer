export class ADSREnvelope {
  attack: number; // sec
  decay: number; // sec
  sustain: number; // 0..1
  release: number;  // sec

  constructor(public gain: AudioParam) {
    this.attack = 0.2;
    this.decay = 0.3;
    this.sustain = 0.7;
    this.release = 0.2;
    this.gain.value = 0;
  }

  trigger(time: number) {
    // Attack
    this.gain.cancelScheduledValues(time);
    this.gain.setValueAtTime(0, time);
    this.gain.linearRampToValueAtTime(1, time + this.attack);

    // Decay
    this.gain.linearRampToValueAtTime(this.sustain, time + this.attack + this.decay);
  }

  untrigger(time: number) {
    // Release
    this.gain.cancelAndHoldAtTime(time);
    this.gain.setValueAtTime(this.gain.value, time); // is needed for long notes but makes no sense
    this.gain.linearRampToValueAtTime(0, time + this.release);
  }
}
