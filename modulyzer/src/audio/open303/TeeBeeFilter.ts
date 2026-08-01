import { OnePoleFilter } from "./OnePoleFilter";

export class TeeBeeFilter {
  private cutoff: number;
  private drive: number;
  private driveFactor: number;
  private resonanceRaw: number;
  private resonanceSkewed: number;
  private g: number;
  private sampleRate: number;
  private twoPiOverSampleRate: number;
  private mode: number;
  private c0: number;
  private c1: number;
  private c2: number;
  private c3: number;
  private c4: number;
  private y1: number;
  private y2: number;
  private y3: number;
  private y4: number;
  private feedbackHighpass: OnePoleFilter;

  // Constants for modes
  private static NUM_MODES = 16;
  private static FLAT = 0;
  private static LP_6 = 1;
  private static LP_12 = 2;
  private static LP_18 = 3;
  private static LP_24 = 4;
  private static HP_6 = 5;
  private static HP_12 = 6;
  private static HP_18 = 7;
  private static HP_24 = 8;
  private static BP_12_12 = 9;
  private static BP_6_18 = 10;
  private static BP_18_6 = 11;
  private static BP_6_12 = 12;
  private static BP_12_6 = 13;
  private static BP_6_6 = 14;
  private static TB_303 = 15; // Example, adjust as needed
  private a1: number;
  private b0: number;
  private k: number;
  // private g: number;

  constructor() {
    this.cutoff = 1000.0;
    this.drive = 0.0;
    this.driveFactor = 1.0;
    this.resonanceRaw = 0.0;
    this.resonanceSkewed = 0.0;
    this.a1 = 0.0;
    this.b0 = 0.0;
    this.k = 0.0;
    this.g = 1.0;
    this.sampleRate = 44100.0;
    this.twoPiOverSampleRate = (2.0 * Math.PI) / this.sampleRate;

    this.feedbackHighpass = new OnePoleFilter();
    this.feedbackHighpass.setMode(OnePoleFilter.HIGHPASS);
    this.feedbackHighpass.setCutoff(150.0);

    this.setMode(TeeBeeFilter.TB_303);
    this.calculateCoefficientsExact();
    this.reset();
  }

  setSampleRate(newSampleRate: number): void {
    if (newSampleRate > 0.0) {
      this.sampleRate = newSampleRate;
    }
    this.twoPiOverSampleRate = (2.0 * Math.PI) / this.sampleRate;
    this.feedbackHighpass.setSampleRate(newSampleRate);
    this.calculateCoefficientsExact();
  }

  setDrive(newDrive: number): void {
    this.drive = newDrive;
    this.driveFactor = this.dB2amp(this.drive);
  }

  setMode(newMode: number): void {
    if (newMode >= 0 && newMode < TeeBeeFilter.NUM_MODES) {
      this.mode = newMode;
      switch (this.mode) {
        case TeeBeeFilter.FLAT:
          this.c0 = 1.0;
          this.c1 = 0.0;
          this.c2 = 0.0;
          this.c3 = 0.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.LP_6:
          this.c0 = 0.0;
          this.c1 = 1.0;
          this.c2 = 0.0;
          this.c3 = 0.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.LP_12:
          this.c0 = 0.0;
          this.c1 = 0.0;
          this.c2 = 1.0;
          this.c3 = 0.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.LP_18:
          this.c0 = 0.0;
          this.c1 = 0.0;
          this.c2 = 0.0;
          this.c3 = 1.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.LP_24:
          this.c0 = 0.0;
          this.c1 = 0.0;
          this.c2 = 0.0;
          this.c3 = 0.0;
          this.c4 = 1.0;
          break;
        case TeeBeeFilter.HP_6:
          this.c0 = 1.0;
          this.c1 = -1.0;
          this.c2 = 0.0;
          this.c3 = 0.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.HP_12:
          this.c0 = 1.0;
          this.c1 = -2.0;
          this.c2 = 1.0;
          this.c3 = 0.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.HP_18:
          this.c0 = 1.0;
          this.c1 = -3.0;
          this.c2 = 3.0;
          this.c3 = -1.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.HP_24:
          this.c0 = 1.0;
          this.c1 = -4.0;
          this.c2 = 6.0;
          this.c3 = -4.0;
          this.c4 = 1.0;
          break;
        case TeeBeeFilter.BP_12_12:
          this.c0 = 0.0;
          this.c1 = 0.0;
          this.c2 = 1.0;
          this.c3 = -2.0;
          this.c4 = 1.0;
          break;
        case TeeBeeFilter.BP_6_18:
          this.c0 = 0.0;
          this.c1 = 0.0;
          this.c2 = 0.0;
          this.c3 = 1.0;
          this.c4 = -1.0;
          break;
        case TeeBeeFilter.BP_18_6:
          this.c0 = 0.0;
          this.c1 = 1.0;
          this.c2 = -3.0;
          this.c3 = 3.0;
          this.c4 = -1.0;
          break;
        case TeeBeeFilter.BP_6_12:
          this.c0 = 0.0;
          this.c1 = 0.0;
          this.c2 = 1.0;
          this.c3 = -1.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.BP_12_6:
          this.c0 = 0.0;
          this.c1 = 1.0;
          this.c2 = -2.0;
          this.c3 = 1.0;
          this.c4 = 0.0;
          break;
        case TeeBeeFilter.BP_6_6:
          this.c0 = 0.0;
          this.c1 = 1.0;
          this.c2 = -1.0;
          this.c3 = 0.0;
          this.c4 = 0.0;
          break;
        default:
          this.c0 = 1.0;
          this.c1 = 0.0;
          this.c2 = 0.0;
          this.c3 = 0.0;
          this.c4 = 0.0;
      }
    }
    this.calculateCoefficientsApprox4();
  }

  setFeedbackHighpassCutoff(newCutoff) { this.feedbackHighpass.setCutoff(newCutoff); }

  reset(): void {
    this.feedbackHighpass.reset();
    this.y1 = 0.0;
    this.y2 = 0.0;
    this.y3 = 0.0;
    this.y4 = 0.0;
  }

  private dB2amp(dB: number): number {
    return Math.pow(10, dB / 20); // Converts dB to amplitude
  }

  setCutoff(newCutoff: number, updateCoefficients: boolean = true): void {
    if (newCutoff !== this.cutoff) {
      if (newCutoff < 200.0) {
        this.cutoff = 200.0; // Absolute floor
      } else if (newCutoff > 20000.0) {
        this.cutoff = 20000.0;
      } else {
        this.cutoff = newCutoff;
      }

      if (updateCoefficients) {
        this.calculateCoefficientsApprox4();
      }
    }
  }

  setResonance(newResonance: number, updateCoefficients: boolean = true): void {
    this.resonanceRaw = 0.01 * newResonance;
    this.resonanceSkewed =
      (1.0 - Math.exp(-3.0 * this.resonanceRaw)) /
      (1.0 - Math.exp(-3.0));

    if (updateCoefficients) {
      this.calculateCoefficientsApprox4();
    }
  }

  calculateCoefficientsExact(): void {
    const wc = this.twoPiOverSampleRate * this.cutoff;
    const s = Math.sin(wc);
    const c = Math.cos(wc);
    const t = Math.tan(0.25 * (wc - Math.PI));
    const r = this.resonanceSkewed;

    const a1_fullRes = t / (s - c * t);
    const x = Math.exp(-wc);
    const a1_noRes = -x;

    this.a1 = r * a1_fullRes + (1.0 - r) * a1_noRes;
    this.b0 = 1.0 + this.a1;

    const gsq =
      (this.b0 * this.b0) /
      (1.0 + this.a1 * this.a1 + 2.0 * this.a1 * c);
    this.k = r / (gsq * gsq);

    if (this.mode === TeeBeeFilter.TB_303) {
      this.k *= 17.0 / 4.0;
    }
  }

  calculateCoefficientsApprox4(): void {
    const wc = this.twoPiOverSampleRate * this.cutoff;
    const wc2 = wc * wc;
    const r = this.resonanceSkewed;

    const pa = [
      -1.341281325101042e-02, 8.168739417977708e-02, -2.365036766021623e-01,
      4.439739664918068e-01, -6.297350825423579e-01, 7.529691648678890e-01,
      -8.249882473764324e-01, 8.736418933533319e-01, -9.164580250284832e-01,
      9.583192455599817e-01, -9.999994950291231e-01, 9.999999927726119e-01,
      -9.999999999857464e-01
    ];

    let tmp = wc2 * pa[0] + pa[1] * wc + pa[2];
    tmp = wc2 * tmp + pa[3] * wc + pa[4];
    tmp = wc2 * tmp + pa[5] * wc + pa[6];
    tmp = wc2 * tmp + pa[7] * wc + pa[8];
    tmp = wc2 * tmp + pa[9] * wc + pa[10];
    this.a1 = wc2 * tmp + pa[11] * wc + pa[12];
    this.b0 = 1.0 + this.a1;

    const pr = [
      -4.554677015609929e-05, -2.022131730719448e-05, 2.784706718370008e-03,
      2.079921151733780e-03, -8.333236384240325e-02, -1.666668203490468e-01,
      1.000000012124230e+00, 3.999999999650040e+00, 4.000000000000113e+00
    ];

    tmp = wc2 * pr[0] + pr[1] * wc + pr[2];
    tmp = wc2 * tmp + pr[3] * wc + pr[4];
    tmp = wc2 * tmp + pr[5] * wc + pr[6];
    tmp = wc2 * tmp + pr[7] * wc + pr[8];
    this.k = r * tmp;
    this.g = 1.0;

    if (this.mode === TeeBeeFilter.TB_303) {
      const fx = (wc * (1 / Math.SQRT2)) / (2 * Math.PI);
      this.b0 =
        (0.00045522346 + 6.1922189 * fx) /
        (1.0 + 12.358354 * fx + 4.4156345 * (fx * fx));
      this.k =
        fx *
          (fx *
            (fx *
              (fx *
                (fx *
                  (fx + 7198.6997) -
                  5837.7917) -
                476.47308) +
              614.95611) +
            213.87126) +
        16.998792;
      this.g =
        ((this.k * 0.058823529411764705882352941176471 - 1.0) * r + 1.0) *
        (1.0 + r);
      this.k *= r;
    }
  }

  shape(x: number): number {
    const r6 = 1.0 / 6.0;
    x = this.clip(x, -Math.SQRT2, Math.SQRT2);
    return x - r6 * x * x * x;
  }

  getSample(input: number): number {
    let y0: number;

    if (this.mode === TeeBeeFilter.TB_303) {
      // Apply feedback and process signal in TB-303 mode
      y0 = input - this.feedbackHighpass.getSample(this.k * this.y4);
      this.y1 += 2 * this.b0 * (y0 - this.y1 + this.y2);
      this.y2 += this.b0 * (this.y1 - 2 * this.y2 + this.y3);
      this.y3 += this.b0 * (this.y2 - 2 * this.y3 + this.y4);
      this.y4 += this.b0 * (this.y3 - 2 * this.y4);
      return 2 * this.g * this.y4;
    }

    // Apply drive and feedback for other modes
    y0 = 0.125 * this.driveFactor * input - this.feedbackHighpass.getSample(this.k * this.y4);

    // Cascade of four 1st order sections without nonlinearities
    this.y1 = y0 + this.a1 * (y0 - this.y1);
    this.y2 = this.y1 + this.a1 * (this.y1 - this.y2);
    this.y3 = this.y2 + this.a1 * (this.y2 - this.y3);
    this.y4 = this.y3 + this.a1 * (this.y3 - this.y4);

    return 8.0 * (this.c0 * y0 + this.c1 * this.y1 + this.c2 * this.y2 + this.c3 * this.y3 + this.c4 * this.y4);
  }

  private clip(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
  }
}
