import { dB2amp } from "./Functions";

export class BiquadFilter {
  private frequency: number = 1000.0;
  private gain: number = 0.0;
  private bandwidth: number = 2.0 * Math.asinh(1.0 / Math.sqrt(2.0)) / Math.log(2.0);
  private sampleRate: number = 44100.0;
  private mode: number = 0; // BYPASS mode
  private b0: number = 1.0;
  private b1: number = 0.0;
  private b2: number = 0.0;
  private a1: number = 0.0;
  private a2: number = 0.0;
  private x1: number = 0.0;
  private x2: number = 0.0;
  private y1: number = 0.0;
  private y2: number = 0.0;

  static ALLPASS = 0;
  static LOWPASS6 = 1;
  static LOWPASS12 = 2;
  static HIGHPASS6 = 3;
  static HIGHPASS12 = 4;
  static BANDPASS = 5;
  static BANDREJECT = 6;
  
  constructor() {
    this.calcCoeffs();
    this.reset();
  }

  // Set the sample rate
  setSampleRate(newSampleRate: number): void {
    if (newSampleRate > 0.0) {
      this.sampleRate = newSampleRate;
      this.calcCoeffs();
    }
  }

  // Set the filter mode
  setMode(newMode: number): void {
    this.mode = newMode; // 0: bypass, 1: Low Pass, 2: High Pass, etc.
    this.calcCoeffs();
  }

  // Set the frequency
  setFrequency(newFrequency: number): void {
    this.frequency = newFrequency;
    this.calcCoeffs();
  }

  // Set the gain
  setGain(newGain: number): void {
    this.gain = newGain;
    this.calcCoeffs();
  }

  // Set the bandwidth
  setBandwidth(newBandwidth: number): void {
    this.bandwidth = newBandwidth;
    this.calcCoeffs();
  }

  // Calculate coefficients based on mode and parameters
  private calcCoeffs(): void {
    const w = (2 * Math.PI * this.frequency) / this.sampleRate;
    let s: number, c: number;

    switch (this.mode) {
      case 1: // LOWPASS6
        const xLP6 = Math.exp(-w);
        this.a1 = xLP6;
        this.a2 = 0.0;
        this.b0 = 1.0 - xLP6;
        this.b1 = 0.0;
        this.b2 = 0.0;
        break;

      case 2: // LOWPASS12
        s = Math.sin(w);
        c = Math.cos(w);
        const qLP12 = dB2amp(this.gain);
        const alphaLP12 = s / (2.0 * qLP12);
        const scaleLP12 = 1.0 / (1.0 + alphaLP12);
        this.a1 = 2.0 * c * scaleLP12;
        this.a2 = (alphaLP12 - 1.0) * scaleLP12;
        this.b1 = (1.0 - c) * scaleLP12;
        this.b0 = 0.5 * this.b1;
        this.b2 = this.b0;
        break;

      case 3: // HIGHPASS6
        const xHP6 = Math.exp(-w);
        this.a1 = xHP6;
        this.a2 = 0.0;
        this.b0 = 0.5 * (1.0 + xHP6);
        this.b1 = -this.b0;
        this.b2 = 0.0;
        break;

      case 4: // HIGHPASS12
        s = Math.sin(w);
        c = Math.cos(w);
        const qHP12 = dB2amp(this.gain);
        const alphaHP12 = s / (2.0 * qHP12);
        const scaleHP12 = 1.0 / (1.0 + alphaHP12);
        this.a1 = 2.0 * c * scaleHP12;
        this.a2 = (alphaHP12 - 1.0) * scaleHP12;
        this.b1 = -(1.0 + c) * scaleHP12;
        this.b0 = -0.5 * this.b1;
        this.b2 = this.b0;
        break;

      case 5: // BANDPASS
        s = Math.sin(w);
        c = Math.cos(w);
        const alphaBP = s * Math.sinh(0.5 * Math.log(2.0) * this.bandwidth * w / s);
        const scaleBP = 1.0 / (1.0 + alphaBP);
        this.a1 = 2.0 * c * scaleBP;
        this.a2 = (alphaBP - 1.0) * scaleBP;
        this.b1 = 0.0;
        this.b0 = 0.5 * s * scaleBP;
        this.b2 = -this.b0;
        break;

      case 6: // BANDREJECT
        s = Math.sin(w);
        c = Math.cos(w);
        const alphaBR = s * Math.sinh(0.5 * Math.log(2.0) * this.bandwidth * w / s);
        const scaleBR = 1.0 / (1.0 + alphaBR);
        this.a1 = 2.0 * c * scaleBR;
        this.a2 = (alphaBR - 1.0) * scaleBR;
        this.b0 = 1.0 * scaleBR;
        this.b1 = -2.0 * c * scaleBR;
        this.b2 = 1.0 * scaleBR;
        break;

      case 0: // BYPASS
      default:
        this.b0 = 1.0;
        this.b1 = 0.0;
        this.b2 = 0.0;
        this.a1 = 0.0;
        this.a2 = 0.0;
    }
  }

  // Reset filter state
  reset(): void {
    this.x1 = 0.0;
    this.x2 = 0.0;
    this.y1 = 0.0;
    this.y2 = 0.0;
  }

  getSample(inn)
  {
    const TINY = Number.MIN_VALUE

    // calculate the output sample:
    const y = this.b0*inn + this.b1*this.x1 + this.b2*this.x2 + this.a1*this.y1 + this.a2*this.y2 + TINY;

    // update the buffer variables:
    this.x2 = this.x1;
    this.x1 = inn;
    this.y2 = this.y1;
    this.y1 = y;

    return y;
  }

}
