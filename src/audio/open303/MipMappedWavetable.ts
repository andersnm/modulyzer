// const SILENCE = 0
// const SINE = 1
// const TRIANGLE = 2
// const SQUARE = 3
// const SAW = 4
// const SQUARE303 = 5
// const SAW303 = 6

import { FourierTransformerRadix2 } from "./FourierTransformerRadix2";

function circularShift<T>(buffer: T[], length: number, numPositions: number): void {
  if (length > buffer.length) {
    throw new Error("Specified length exceeds buffer size.");
  }

  const absPositions = Math.abs(numPositions) % length;

  if (numPositions < 0) {
    // Shift left
    const tmp = buffer.slice(0, absPositions);
    for (let i = absPositions; i < length; i++) {
      buffer[i - absPositions] = buffer[i];
    }
    for (let i = 0; i < absPositions; i++) {
      buffer[length - absPositions + i] = tmp[i];
    }
  } else if (numPositions > 0) {
    // Shift right
    const tmp = buffer.slice(length - absPositions, length);
    for (let i = length - absPositions - 1; i >= 0; i--) {
      buffer[i + absPositions] = buffer[i];
    }
    for (let i = 0; i < absPositions; i++) {
      buffer[i] = tmp[i];
    }
  }
}

// function circularShift<T>(buffer: T[], numPositions: number): void {
//   const length = buffer.length;
//   const absPositions = Math.abs(numPositions) % length;

//   if (numPositions < 0) {
//     // Shift left
//     const tmp = buffer.slice(0, absPositions);
//     buffer.splice(0, absPositions);
//     buffer.push(...tmp);
//   } else if (numPositions > 0) {
//     // Shift right
//     const tmp = buffer.slice(length - absPositions);
//     buffer.splice(length - absPositions, absPositions);
//     buffer.unshift(...tmp);
//   }
// }

function clip<T>(x: T, min: T, max: T): T {
  if (x > max) {
    return max;
  } else if (x < min) {
    return min;
  } else {
    return x;
  }
}

export class MipMappedWaveTable {
  static SILENCE = 0
  static SINE = 1
  static TRIANGLE = 2
  static SQUARE = 3
  static SAW = 4
  static SQUARE303 = 5
  static SAW303 = 6
  
  sampleRate: number = 44100.0;
  waveform: number = 0;
  symmetry: number = 0.5;

  tanhShaperFactor: number = this.dB2amp(36.9);
  tanhShaperOffset: number = 4.37;
  squarePhaseShift: number = 180.0;

  static tableLength: number = 2048;
  numTables: number = 12; // Example value, adjust as needed

  prototypeTable: number[] = new Array(MipMappedWaveTable.tableLength + 4).fill(0);
  tableSet: Float64Array[] = Array.from({ length: this.numTables }, () =>
    new Float64Array(MipMappedWaveTable.tableLength + 4).fill(0)
  );

  fourierTransformer: FourierTransformerRadix2; // Placeholder for fourier transformer

  constructor() {
    this.fourierTransformer = new FourierTransformerRadix2();
    this.fourierTransformer.setBlockSize(MipMappedWaveTable.tableLength);
  
    this.initPrototypeTable();
    this.initTableSet();
  }

  private dB2amp(db: number): number {
    return Math.pow(10, db / 20);
  }

  setWaveform(newWaveform: number[] | number, lengthInSamples?: number): void {
    if (Array.isArray(newWaveform)) {
      if (lengthInSamples === MipMappedWaveTable.tableLength) {
        for (let i = 0; i < MipMappedWaveTable.tableLength; i++) {
          this.prototypeTable[i] = newWaveform[i];
        }
      } else {
        // Periodic sinc-interpolation placeholder
      }
      this.generateMipMap();
    } else if (typeof newWaveform === "number") {
      if (newWaveform >= 0 && newWaveform !== this.waveform) {
        this.waveform = newWaveform;
        this.renderWaveform();
      }
    }
  }

  setSymmetry(newSymmetry: number): void {
    this.symmetry = newSymmetry;
    this.renderWaveform();
  }

  private initPrototypeTable(): void {
    this.prototypeTable.fill(0);
  }

  private initTableSet(): void {
    for (let t = 0; t < this.numTables; t++) {
      this.tableSet[t].fill(0);
    }
  }

  private removeDC(): void {
    const dcOffset =
      this.prototypeTable.reduce((sum, val) => sum + val, 0) / MipMappedWaveTable.tableLength;

    for (let i = 0; i < MipMappedWaveTable.tableLength; i++) {
      this.prototypeTable[i] -= dcOffset;
    }
  }

  private normalize(): void {
    const max = Math.max(...this.prototypeTable.map(Math.abs));
    if (max > 0) {
      const scale = 1.0 / max;
      for (let i = 0; i < MipMappedWaveTable.tableLength; i++) {
        this.prototypeTable[i] *= scale;
      }
    }
  }

  private reverseTime(): void {
    const tmpTable = [...this.prototypeTable].reverse();
    for (let i = 0; i < MipMappedWaveTable.tableLength; i++) {
      this.prototypeTable[i] = tmpTable[i];
    }
  }

  private renderWaveform(): void {
    switch (this.waveform) {
      case MipMappedWaveTable.SINE:
        this.fillWithSine();
        break;
      case MipMappedWaveTable.TRIANGLE:
        this.fillWithTriangle();
        break;
      case MipMappedWaveTable.SQUARE:
        this.fillWithSquare();
        break;
      case MipMappedWaveTable.SAW:
        this.fillWithSaw();
        break;
      case MipMappedWaveTable.SQUARE303:
        this.fillWithSquare303();
        break;
      case MipMappedWaveTable.SAW303:
        this.fillWithSaw303();
        break;
      default:
        this.fillWithSine();
    }
  }

  private generateMipMap(): void {
    const spectrum: {re,im}[] = new Array(MipMappedWaveTable.tableLength);
    for (let i = 0; i < spectrum.length; i++) {
      spectrum[i] = {re: 0, im:0};
    }

    let t: number, i: number; // indices for the table and position
  
    // Copy the prototypeTable into the 1st table of the mipmap:
    t = 0;
    for (i = 0; i < MipMappedWaveTable.tableLength; i++) {
      this.tableSet[0][i] = this.prototypeTable[i];
    }
  
    // Additional samples for the interpolator:
    this.tableSet[t][MipMappedWaveTable.tableLength] = this.tableSet[t][0];
    this.tableSet[t][MipMappedWaveTable.tableLength + 1] = this.tableSet[t][1];
    this.tableSet[t][MipMappedWaveTable.tableLength + 2] = this.tableSet[t][2];
    this.tableSet[t][MipMappedWaveTable.tableLength + 3] = this.tableSet[t][3];
  
    // Get the spectrum from the prototype table:
    this.fourierTransformer.transformRealSignal(this.prototypeTable, spectrum);
  
    // Ensure that DC and Nyquist are zero:
    spectrum[0].re = 0.0;
    spectrum[0].im = 0.0;
    // spectrum[1].re = 0.0;
    // spectrum[1].im = 0.0;
  
    // Render the bandlimited versions by successively shrinking the spectrum:
    let lowBin: number, highBin: number;
    for (t = 1; t < this.numTables; t++) {
      lowBin = Math.floor(MipMappedWaveTable.tableLength / Math.pow(2.0, t)); // cutoff bin
      highBin = Math.floor(MipMappedWaveTable.tableLength / Math.pow(2.0, t - 1)); // current bin
  
      // TODO; spectrum was ported as complex, but treated as array of doubles, so halving the indices

      // Zero out the bins above the cutoff-bin:
      for (i = ((lowBin / 2) | 0); i < (highBin / 2); i++) {
        spectrum[i].re = 0.0;
        spectrum[i].im = 0.0;
      }
  
      // Transform the truncated spectrum back to the time domain:
      this.fourierTransformer.transformSymmetricSpectrum(spectrum, this.tableSet[t]);
  
      // Additional samples for the interpolator:
      this.tableSet[t][MipMappedWaveTable.tableLength] = this.tableSet[t][0];
      this.tableSet[t][MipMappedWaveTable.tableLength + 1] = this.tableSet[t][1];
      this.tableSet[t][MipMappedWaveTable.tableLength + 2] = this.tableSet[t][2];
      this.tableSet[t][MipMappedWaveTable.tableLength + 3] = this.tableSet[t][3];
    }
  }

  private fillWithSine(): void {
    for (let i = 0; i < MipMappedWaveTable.tableLength; i++) {
      this.prototypeTable[i] =
        Math.sin((2.0 * Math.PI * i) / MipMappedWaveTable.tableLength);
    }
    this.generateMipMap();
  }

  fillWithTriangle(): void {
    for (let i = 0; i < MipMappedWaveTable.tableLength / 4; i++) {
      this.prototypeTable[i] = (4 * i) / MipMappedWaveTable.tableLength;
    }
  
    for (let i = MipMappedWaveTable.tableLength / 4; i < (3 * MipMappedWaveTable.tableLength) / 4; i++) {
      this.prototypeTable[i] = 2.0 - (4 * i) / MipMappedWaveTable.tableLength;
    }
  
    for (let i = (3 * MipMappedWaveTable.tableLength) / 4; i < MipMappedWaveTable.tableLength; i++) {
      this.prototypeTable[i] = -4.0 + (4 * i) / MipMappedWaveTable.tableLength;
    }
  
    this.generateMipMap();
  }
  
  fillWithSquare(): void {
    const N = MipMappedWaveTable.tableLength;
    const k = this.symmetry;
    const N1 = clip(Math.round(k * (N - 1)), 1, N - 1);
  
    for (let n = 0; n < N1; n++) {
      this.prototypeTable[n] = +1.0;
    }
    for (let n = N1; n < N; n++) {
      this.prototypeTable[n] = -1.0;
    }
  
    this.generateMipMap();
  }
  
  fillWithSaw(): void {
    const N = MipMappedWaveTable.tableLength;
    const k = this.symmetry;
    const N1 = clip(Math.round(k * (N - 1)), 1, N - 1);
    const N2 = N - N1;
    const s1 = 1.0 / (N1 - 1);
    const s2 = 1.0 / N2;
  
    for (let n = 0; n < N1; n++) {
      this.prototypeTable[n] = s1 * n;
    }
    for (let n = N1; n < N; n++) {
      this.prototypeTable[n] = -1.0 + s2 * (n - N1);
    }
  
    this.generateMipMap();
  }
  
  fillWithSquare303(): void {
    const N = MipMappedWaveTable.tableLength;
    const k = 0.5;
    const N1 = clip(Math.round(k * (N - 1)), 1, N - 1);
    const N2 = N - N1;
    const s1 = 1.0 / (N1 - 1);
    const s2 = 1.0 / N2;
  
    for (let n = 0; n < N1; n++) {
      this.prototypeTable[n] = s1 * n;
    }
    for (let n = N1; n < N; n++) {
      this.prototypeTable[n] = -1.0 + s2 * (n - N1);
    }
  
    for (let n = 0; n < N; n++) {
      this.prototypeTable[n] = -Math.tanh(this.tanhShaperFactor * this.prototypeTable[n] + this.tanhShaperOffset);
    }
  
    const nShift = Math.round((N * this.squarePhaseShift) / 360.0);
    circularShift(this.prototypeTable, N, nShift);
  
    this.generateMipMap();
  }
  
  fillWithSaw303(): void {
    const N = MipMappedWaveTable.tableLength;
    const k = 0.5;
    const N1 = clip(Math.round(k * (N - 1)), 1, N - 1);
    const N2 = N - N1;
    const s1 = 1.0 / (N1 - 1);
    const s2 = 1.0 / N2;
  
    for (let n = 0; n < N1; n++) {
      this.prototypeTable[n] = s1 * n;
    }
    for (let n = N1; n < N; n++) {
      this.prototypeTable[n] = -1.0 + s2 * (n - N1);
    }
  
    this.generateMipMap();
  }
  
  fillWithPeak(): void {
    for (let i = 0; i < MipMappedWaveTable.tableLength / 2; i++) {
      this.prototypeTable[i] = 1 - (2 * i) / MipMappedWaveTable.tableLength;
    }
  
    for (let i = MipMappedWaveTable.tableLength / 2; i < MipMappedWaveTable.tableLength; i++) {
      this.prototypeTable[i] = 0.0;
    }
  
    this.removeDC();
    this.normalize();
    this.generateMipMap();
  }
  
  fillWithMoogSaw(): void {
    for (let i = 0; i < MipMappedWaveTable.tableLength / 2; i++) {
      this.prototypeTable[i] = (2 * i) / MipMappedWaveTable.tableLength;
    }
  
    for (let i = MipMappedWaveTable.tableLength / 2; i < MipMappedWaveTable.tableLength; i++) {
      this.prototypeTable[i] = (2 * i) / MipMappedWaveTable.tableLength - 2.0;
    }
  
    for (let i = 0; i < MipMappedWaveTable.tableLength / 2; i++) {
      this.prototypeTable[i] += 1 - (4 * i) / MipMappedWaveTable.tableLength;
    }
  
    for (let i = MipMappedWaveTable.tableLength / 2; i < MipMappedWaveTable.tableLength; i++) {
      this.prototypeTable[i] += -1 + (4 * i) / MipMappedWaveTable.tableLength;
    }
  
    this.removeDC();
    this.normalize();
    this.generateMipMap();
  }

  getValueLinear(integerPart: number, fractionalPart: number, tableIndex: number): number {
    // Ensure the table index is in the valid range
    if (tableIndex <= 0) {
      tableIndex = 0;
    } else if (tableIndex > this.numTables) {
      tableIndex = this.numTables; // Assuming numTables limits tableIndex
    }

    return (
      (1.0 - fractionalPart) * this.tableSet[tableIndex][integerPart] +
      fractionalPart * this.tableSet[tableIndex][integerPart + 1]
    );
  }

  getValueLinearByPhaseIndex(phaseIndex: number, tableIndex: number): number {
    // Calculate integer and fractional part of the phaseIndex
    const intIndex = Math.floor(phaseIndex); // Replace `floorInt` with `Math.floor`
    const frac = phaseIndex - intIndex;

    return this.getValueLinear(intIndex, frac, tableIndex);
  }
}
