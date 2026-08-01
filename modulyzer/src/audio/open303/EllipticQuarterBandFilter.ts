export class EllipticQuarterBandFilter {
  // State buffer
  private w: number[] = new Array(12).fill(0);

  // Constructor
  constructor() {
    this.reset();
  }

  // Reset the filter state
  reset(): void {
    this.w.fill(0);
  }

  // Calculate a single filtered output sample
  getSample(input: number): number {
    const a01 = -9.1891604652189471;
    const a02 = 40.177553696870497;
    const a03 = -110.11636661771178;
    const a04 = 210.18506612078195;
    const a05 = -293.8474477190324;
    const a06 = 308.16345558359234;
    const a07 = -244.06786780384243;
    const a08 = 144.81877911392738;
    const a09 = -62.770692151724198;
    const a10 = 18.867762095902137;
    const a11 = -3.5327094230551848;
    const a12 = 0.31183189275203149;

    const b00 = 0.00013671732099945628;
    const b01 = -0.00055538501265606384;
    const b02 = 0.0013681887636296387;
    const b03 = -0.0022158566490711852;
    const b04 = 0.0028320091007278322;
    const b05 = -0.0029776933151090413;
    const b06 = 0.0030283628243514991;
    const b07 = -0.0029776933151090413;
    const b08 = 0.0028320091007278331;
    const b09 = -0.0022158566490711861;
    const b10 = 0.0013681887636296393;
    const b11 = -0.00055538501265606384;
    const b12 = 0.00013671732099945636;

    // Smallest positive value for numerical stability
    const TINY = Number.MIN_VALUE;

    // Calculate the intermediate and output sample using Direct Form II
    const tmp =
      input + TINY -
      (
        (a01 * this.w[0] + a02 * this.w[1]) +
        (a03 * this.w[2] + a04 * this.w[3]) +
        (a05 * this.w[4] + a06 * this.w[5]) +
        (a07 * this.w[6] + a08 * this.w[7]) +
        (a09 * this.w[8] + a10 * this.w[9]) +
        (a11 * this.w[10] + a12 * this.w[11])
      );

    const y =
      b00 * tmp +
      (
        (b01 * this.w[0] + b02 * this.w[1]) +
        (b03 * this.w[2] + b04 * this.w[3]) +
        (b05 * this.w[4] + b06 * this.w[5]) +
        (b07 * this.w[6] + b08 * this.w[7]) +
        (b09 * this.w[8] + b10 * this.w[9]) +
        (b11 * this.w[10] + b12 * this.w[11])
      );

    // Update state variables (shift state buffer)
    this.w = [tmp, ...this.w.slice(0, 11)];

    return y;
  }
}
