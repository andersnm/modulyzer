import { MipMappedWaveTable } from "./MipMappedWavetable";

export class BlendOscillator {
  private tableLengthDbl: number;
  private sampleRate: number;
  private freq: number;
  private increment: number;
  private phaseIndex: number;
  private startIndex: number;
  private waveTable1: MipMappedWaveTable | null; 
  private waveTable2: MipMappedWaveTable | null; 

  constructor() {
    this.tableLengthDbl = MipMappedWaveTable.tableLength; 
    this.sampleRate = 44100.0;
    this.freq = 440.0;
    this.increment = (this.tableLengthDbl * this.freq) / this.sampleRate;
    this.phaseIndex = 0.0;
    this.startIndex = 0.0;
    this.waveTable1 = null;
    this.waveTable2 = null;

    this.setSampleRate(44100.0);
    this.setFrequency(440.0);
    this.setStartPhase(0.0);

    this.setWaveForm1(MipMappedWaveTable.SAW);
    this.setWaveForm2(MipMappedWaveTable.SQUARE);

    this.resetPhase();
  }

  setSampleRate(newSampleRate: number): void {
    if (newSampleRate > 0.0) {
      this.sampleRate = newSampleRate;
    }
    const sampleRateRec = 1.0 / this.sampleRate;
    this.increment = this.tableLengthDbl * this.freq * sampleRateRec;
  }

  setWaveForm1(newWaveForm1: number): void {
    if (this.waveTable1 != null) {
      this.waveTable1.setWaveform(newWaveForm1);
    }
  }

  setWaveForm2(newWaveForm2: number): void {
    if (this.waveTable2 != null) {
      this.waveTable2.setWaveform(newWaveForm2);
    }
  }

  setWaveTable1(newWaveTable1: MipMappedWaveTable): void {
    this.waveTable1 = newWaveTable1;
  }

  setWaveTable2(newWaveTable2: MipMappedWaveTable): void {
    this.waveTable2 = newWaveTable2;
  }

  setStartPhase(startPhase: number): void {
    if (startPhase >= 0 && startPhase <= 360) {
      this.startIndex = (startPhase / 360.0) * this.tableLengthDbl;
    }
  }

  resetPhase(): void {
    this.phaseIndex = this.startIndex;
  }

  setPhase(phaseIndex: number): void {
    this.phaseIndex = this.startIndex + phaseIndex;
  }

  // Existing member variables and methods are assumed to be already defined...

  setFrequency(newFrequency: number): void {
    if (newFrequency > 0.0 && newFrequency < 20000.0) {
      this.freq = newFrequency;
    }
  }

  setPulseWidth(newPulseWidth: number): void {
    if (this.waveTable1 != null) {
      this.waveTable1.setSymmetry(0.01 * newPulseWidth);
    }
    if (this.waveTable2 != null) {
      this.waveTable2.setSymmetry(0.01 * newPulseWidth);
    }
  }

  calculateIncrement(): void {
    const sampleRateRec = 1.0 / this.sampleRate; // Ensure `sampleRateRec` exists locally
    this.increment = this.tableLengthDbl * this.freq * sampleRateRec;
  }

  blend: number = 0.85; // 0 = saw, 1 = square

  setBlendFactor(newBlendFactor) { 
    this.blend = newBlendFactor; 
  }

  getSample(): number {
    if (this.waveTable1 === null || this.waveTable2 === null) {
      return 0.0;
    }

    let out1: number, out2: number;
    let tableNumber: number;

    // Decide which table is to be used
    tableNumber = Math.floor(Math.log(this.increment)); // Replace `EXPOFDBL` with `Math.log`
    tableNumber += 2; // Adjust this value as needed

    // Wraparound if necessary
    while (this.phaseIndex >= this.tableLengthDbl) {
      this.phaseIndex -= this.tableLengthDbl;
    }

    const intIndex = Math.floor(this.phaseIndex);
    const frac = this.phaseIndex - intIndex;

    out1 = (1.0 - this.blend) * this.waveTable1.getValueLinear(intIndex, frac, tableNumber);
    out2 = this.blend * this.waveTable2.getValueLinear(intIndex, frac, tableNumber);

    out2 *= 0.5; // Temporary scaling for square wave

    this.phaseIndex += this.increment;
    return out1 + out2;
  }
}
