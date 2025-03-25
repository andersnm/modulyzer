export class OnePoleFilter {
  private sampleRate: number = 44100.0;
  private sampleRateRec: number = 1.0 / 44100.0;
  private mode: number = 0; // 0: bypass
  private cutoff: number = 20000.0;
  private shelvingGain: number = 1.0;
  private b0: number = 1.0;
  private b1: number = 0.0;
  private a1: number = 0.0;
  private x1: number = 0.0;
  private y1: number = 0.0;

  static BYPASS = 0;
  static LOWPASS = 1
  static HIGHPASS = 2
  static LOWSHELV = 3
  static HIGHSHELV = 4
  static ALLPASS = 5

  constructor() {
    this.reset();
    this.calcCoeffs();
  }

  // Set sample rate
  setSampleRate(newSampleRate: number): void {
    if (newSampleRate > 0.0) {
      this.sampleRate = newSampleRate;
      this.sampleRateRec = 1.0 / this.sampleRate;
      this.calcCoeffs();
    }
  }

  // Set filter mode
  setMode(newMode: number): void {
    this.mode = newMode; // 0: bypass, 1: Low Pass, 2: High Pass, etc.
    this.calcCoeffs();
  }

  // Set cutoff frequency
  setCutoff(newCutoff: number): void {
    if (newCutoff > 0.0 && newCutoff <= 20000.0) {
      this.cutoff = newCutoff;
    } else {
      this.cutoff = 20000.0;
    }
    this.calcCoeffs();
  }

  // Set shelving gain (linear scale)
  setShelvingGain(newGain: number): void {
    if (newGain > 0.0) {
      this.shelvingGain = newGain;
      this.calcCoeffs();
    } else {
      console.error("Gain must be greater than 0.");
    }
  }

  // Set shelving gain in decibels
  setShelvingGainInDecibels(newGain: number): void {
    this.setShelvingGain(Math.pow(10, newGain / 20)); // Convert dB to linear
  }

  // Set filter coefficients manually
  setCoefficients(newB0: number, newB1: number, newA1: number): void {
    this.b0 = newB0;
    this.b1 = newB1;
    this.a1 = newA1;
  }

  // Set internal state variables
  setInternalState(newX1: number, newY1: number): void {
    this.x1 = newX1;
    this.y1 = newY1;
  }

  // Calculate coefficients
  private calcCoeffs(): void {
    switch (this.mode) {
      case 1: // Low Pass
        const lpX = Math.exp(-2.0 * Math.PI * this.cutoff * this.sampleRateRec);
        this.b0 = 1 - lpX;
        this.b1 = 0.0;
        this.a1 = lpX;
        break;

      case 2: // High Pass
        const hpX = Math.exp(-2.0 * Math.PI * this.cutoff * this.sampleRateRec);
        this.b0 = 0.5 * (1 + hpX);
        this.b1 = -0.5 * (1 + hpX);
        this.a1 = hpX;
        break;

      case 3: // Low Shelving
        const lsC = 0.5 * (this.shelvingGain - 1.0);
        const lsT = Math.tan(Math.PI * this.cutoff * this.sampleRateRec);
        let lsA;
        if (this.shelvingGain >= 1.0) {
          lsA = (lsT - 1.0) / (lsT + 1.0);
        } else {
          lsA = (lsT - this.shelvingGain) / (lsT + this.shelvingGain);
        }
        this.b0 = 1.0 + lsC + lsC * lsA;
        this.b1 = lsC + lsC * lsA + lsA;
        this.a1 = -lsA;
        break;

      case 4: // High Shelving
        const hsC = 0.5 * (this.shelvingGain - 1.0);
        const hsT = Math.tan(Math.PI * this.cutoff * this.sampleRateRec);
        let hsA;
        if (this.shelvingGain >= 1.0) {
          hsA = (hsT - 1.0) / (hsT + 1.0);
        } else {
          hsA = (this.shelvingGain * hsT - 1.0) / (this.shelvingGain * hsT + 1.0);
        }
        this.b0 = 1.0 + hsC - hsC * hsA;
        this.b1 = hsA + hsC * hsA - hsC;
        this.a1 = -hsA;
        break;

      case 5: // All Pass
        const apT = Math.tan(Math.PI * this.cutoff * this.sampleRateRec);
        const apX = (apT - 1.0) / (apT + 1.0);
        this.b0 = apX;
        this.b1 = 1.0;
        this.a1 = -apX;
        break;

      default: // Bypass
        this.b0 = 1.0;
        this.b1 = 0.0;
        this.a1 = 0.0;
        break;
    }
  }

  // Reset filter state
  reset(): void {
    this.x1 = 0.0;
    this.y1 = 0.0;
  }


  getSample(inn: number)
  {
    const TINY = Number.MIN_VALUE
    // calculate the output sample:
    this.y1 = this.b0*inn + this.b1*this.x1 + this.a1*this.y1 + TINY;

    // update the buffer variables:
    this.x1 = inn;

    return this.y1;
  }
}
