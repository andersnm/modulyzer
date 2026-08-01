export class AnalogEnvelope {
  sampleRate: number = 44100.0;
  startLevel: number = 0.0;
  attackTime: number = 0.0;
  peakLevel: number = 1.0;
  holdTime: number = 0.0;
  decayTime: number = 0.1;
  sustainLevel: number = 0.5;
  releaseTime: number = 0.01;
  endLevel: number = 0.0;
  time: number = 0.0;
  timeScale: number = 1.0;
  peakByVel: number = 1.0;
  peakByKey: number = 1.0;
  timeScaleByVel: number = 1.0;
  timeScaleByKey: number = 1.0;
  increment: number = 1000.0 * this.timeScale / this.sampleRate;
  tauScale: number = 1.0;
  peakScale: number = 1.0;
  noteIsOn: boolean = false;
  outputIsZero: boolean = true;
  previousOutput: number = 0.0;

  attackCoeff: number = 1.0;
  decayCoeff: number = 1.0;
  releaseCoeff: number = 1.0;

  attPlusHld: number = 0.0;
  attPlusHldPlusDec: number = 0.0;
  attPlusHldPlusDecPlusRel: number = 0.0;

  constructor() {
    this.setAttack(this.attackTime);
    this.setDecay(this.decayTime);
    this.setRelease(this.releaseTime);
  }

  setSampleRate(newSampleRate: number): void {
    if (newSampleRate > 0.0) {
      this.sampleRate = newSampleRate;
    }

    this.increment = 1000.0 * this.timeScale / this.sampleRate;

    this.setAttack(this.attackTime);
    this.setDecay(this.decayTime);
    this.setRelease(this.releaseTime);
  }

  setSustainLevel(newSustain: number) {
    this.sustainLevel = newSustain;
  }

  setAttack(newAttackTime: number): void {
    if (newAttackTime > 0.0) {
      this.attackTime = newAttackTime;
      const tau = (this.sampleRate * 0.001 * this.attackTime) * this.tauScale / this.timeScale;
      this.attackCoeff = 1.0 - Math.exp(-1.0 / tau);
    } else {
      this.attackTime = 0.0;
      this.attackCoeff = 1.0;
    }
    this.calculateAccumulatedTimes();
  }

  setHold(newHoldTime: number): void {
    if (newHoldTime >= 0) {
      this.holdTime = newHoldTime;
    }
    this.calculateAccumulatedTimes();
  }

  setDecay(newDecayTime: number): void {
    if (newDecayTime > 0.0) {
      this.decayTime = newDecayTime;
      const tau = (this.sampleRate * 0.001 * this.decayTime) * this.tauScale / this.timeScale;
      this.decayCoeff = 1.0 - Math.exp(-1.0 / tau);
    } else {
      this.decayTime = 0.0;
      this.decayCoeff = 1.0;
    }
    this.calculateAccumulatedTimes();
  }

  setRelease(newReleaseTime: number): void {
    if (newReleaseTime > 0.0) {
      this.releaseTime = newReleaseTime;
      const tau = (this.sampleRate * 0.001 * this.releaseTime) * this.tauScale / this.timeScale;
      this.releaseCoeff = 1.0 - Math.exp(-1.0 / tau);
    } else {
      this.releaseTime = 0.0;
      this.releaseCoeff = 1.0;
    }
    this.calculateAccumulatedTimes();
  }

  setTimeScale(newTimeScale: number): void {
    if (newTimeScale > 0) {
      this.timeScale = newTimeScale;
    }

    this.increment = 1000.0 * this.timeScale / this.sampleRate;

    this.setAttack(this.attackTime);
    this.setDecay(this.decayTime);
    this.setRelease(this.releaseTime);
  }

  setTauScale(newTauScale: number): void {
    if (newTauScale > 0) {
      this.tauScale = newTauScale;
    }

    this.setAttack(this.attackTime);
    this.setDecay(this.decayTime);
    this.setRelease(this.releaseTime);
  }

  setPeakScale(newPeakScale: number): void {
    if (newPeakScale > 0) {
      this.peakScale = newPeakScale;
    }
  }

  reset(): void {
    this.time = 0.0;
  }

  noteOn(startFromCurrentLevel: boolean, newKey: number, newVel: number): void {
    if (!startFromCurrentLevel) {
      this.previousOutput = this.startLevel;
    }

    this.time = 0.0;
    this.noteIsOn = true;
    this.outputIsZero = false;
  }

  noteOff(): void {
    this.noteIsOn = false;
    this.time = this.attackTime + this.holdTime + this.decayTime + this.increment;
  }

  endIsReached(): boolean {
    return !this.noteIsOn && this.previousOutput < 0.000001;
  }

  calculateAccumulatedTimes(): void {
    this.attPlusHld = this.attackTime + this.holdTime;
    this.attPlusHldPlusDec = this.attPlusHld + this.decayTime;
    this.attPlusHldPlusDecPlusRel = this.attPlusHldPlusDec + this.releaseTime;
  }

  getSample(): number {
    let out: number;
  
    // Attack or hold phase
    if (this.time <= this.attPlusHld) {
      // No need to check noteIsOn because time is advanced to the beginning of the release phase in noteOff()
      out = this.previousOutput + this.attackCoeff * (this.peakScale * this.peakLevel - this.previousOutput);
      this.time += this.increment;
    }
    // Decay phase
    else if (this.time <= this.attPlusHldPlusDec) {
      // No need to check noteIsOn
      out = this.previousOutput + this.decayCoeff * (this.sustainLevel - this.previousOutput);
      this.time += this.increment;
    }
    // Sustain phase
    else if (this.noteIsOn) {
      out = this.previousOutput + this.decayCoeff * (this.sustainLevel - this.previousOutput);
      // Time is not incremented in sustain phase
    }
    // Release phase
    else {
      out = this.previousOutput + this.releaseCoeff * (this.endLevel - this.previousOutput);
      this.time += this.increment;
    }
  
    // Store output sample for the next call
    this.previousOutput = out; // Adding TINY is unnecessary in TypeScript, as modern JavaScript engines handle denorm problems efficiently
  
    return out;
  }

  isNoteOn() { return this.noteIsOn; }

}
