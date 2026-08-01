export class DecayEnvelope {
  private c: number = 1.0;
  private y: number = 1.0;
  private yInit: number = 1.0;
  private tau: number = 200.0;
  private fs: number = 44100.0; // Sample rate
  private normalizeSum: boolean = false;

  constructor() {
    this.calculateCoefficient();
  }

  // Set the sample rate
  setSampleRate(newSampleRate: number): void {
    if (newSampleRate > 0.0) {
      this.fs = newSampleRate;
      this.calculateCoefficient();
    }
  }

  // Set the decay time constant
  setDecayTimeConstant(newTimeConstant: number): void {
    if (newTimeConstant > 0.001) {
      // Ensure minimum decay time
      this.tau = newTimeConstant;
      this.calculateCoefficient();
    }
  }

  // Enable or disable normalization of the sum
  setNormalizeSum(shouldNormalizeSum: boolean): void {
    this.normalizeSum = shouldNormalizeSum;
    this.calculateCoefficient();
  }

  // Trigger the envelope by resetting its state
  trigger(): void {
    this.y = this.yInit;
  }

  // Check if the end of the envelope is reached (based on a threshold)
  endIsReached(threshold: number): boolean {
    return this.y < threshold;
  }
  
  getDecayTimeConstant() { return this.tau; }

  // Internal function to calculate the coefficient based on parameters
  private calculateCoefficient(): void {
    this.c = Math.exp(-1.0 / (0.001 * this.tau * this.fs));
    if (this.normalizeSum) {
      this.yInit = (1.0 - this.c) / this.c;
    } else {
      this.yInit = 1.0 / this.c;
    }
  }

  getSample()
  {
    this.y *= this.c;
    return this.y;
  }

}
