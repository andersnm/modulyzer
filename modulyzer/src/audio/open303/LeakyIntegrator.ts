export class LeakyIntegrator {
  private sampleRate: number = 44100.0;
  private tau: number = 10.0;
  private coeff: number = 0.0;
  private y1: number = 0.0;

  constructor() {
    this.calculateCoefficient();
  }

  // Set the sample rate
  setSampleRate(newSampleRate: number): void {
    if (newSampleRate > 0.0) {
      this.sampleRate = newSampleRate;
      this.calculateCoefficient();
    }
  }

  // Set the time constant
  setTimeConstant(newTimeConstant: number): void {
    if (newTimeConstant >= 0.0 && newTimeConstant !== this.tau) {
      this.tau = newTimeConstant;
      this.calculateCoefficient();
    }
  }

  // Get the normalizer
  static getNormalizer(tau1: number, tau2: number, fs: number): number {
    const td = 0.001 * tau1;
    const ta = 0.001 * tau2;

    // Handle special cases
    if (ta === 0.0 && td === 0.0) {
      return 1.0;
    } else if (ta === 0.0) {
      return 1.0 / (1.0 - Math.exp(-1.0 / (fs * td)));
    } else if (td === 0.0) {
      return 1.0 / (1.0 - Math.exp(-1.0 / (fs * ta)));
    }

    // Compute the filter coefficients
    let x = Math.exp(-1.0 / (fs * td));
    const bd = 1 - x;
    const ad = -x;

    x = Math.exp(-1.0 / (fs * ta));
    const ba = 1 - x;
    const aa = -x;

    // Compute the location and height of the peak
    let xp: number;
    if (ta === td) {
      const tp = ta;
      const np = fs * tp;
      xp = (np + 1.0) * ba * ba * Math.pow(aa, np);
    } else {
      const tp = Math.log(ta / td) / ((1.0 / td) - (1.0 / ta));
      const np = fs * tp;
      const s = 1.0 / (aa - ad);
      const b01 = s * aa * ba * bd;
      const b02 = s * ad * ba * bd;
      const a01 = s * (ad - aa) * aa;
      const a02 = s * (ad - aa) * ad;
      xp = b01 * Math.pow(a01, np) - b02 * Math.pow(a02, np);
    }

    // Return the normalizer as the reciprocal of the peak height
    return 1.0 / xp;
  }

  // Reset the state
  reset(): void {
    this.y1 = 0.0;
  }

  // Calculate the coefficient
  private calculateCoefficient(): void {
    if (this.tau > 0.0) {
      this.coeff = Math.exp(-1.0 / (this.sampleRate * 0.001 * this.tau));
    } else {
      this.coeff = 0.0;
    }
  }

  setState(newState) { this.y1 = newState; }

  getTimeConstant() { return this.tau; }

  getSample(inn: number)
  {
    return this.y1 = inn + this.coeff*(this.y1-inn);
  }

}
