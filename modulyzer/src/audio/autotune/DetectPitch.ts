import { rdft } from "../open303/Fft";

//Rounds to next power of 2
function nextPow2(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

// Ooura real FFT layout:
// a[0]        = Re(0)
// a[1]        = Re(N/2)
// a[2*k]      = Re(k),   k = 1..N/2-1
// a[2*k + 1]  = Im(k)
function squareSpectrum(a: Float32Array) {
  const n = a.length;
  const n2 = n >>> 1;

  // Zero DC and Nyquist
  a[0] = 0.0;
  a[1] = 0.0;

  for (let k = 1; k < n2; ++k) {
    const re = a[2 * k];
    const im = a[2 * k + 1];
    const mag2 = re * re + im * im;
    a[2 * k] = mag2;
    a[2 * k + 1] = 0.0;
  }
}

function findPeriod(x: Float32Array, lo: number, hi: number, scale_f: number) {
  let loc_m = 0.0;
  for (let i = lo; i < hi; ++i) {
    loc_m = Math.max(loc_m, x[i]);
  }
  const threshold = loc_m * scale_f;
  for (let i = lo; i < hi; ++i) {
    if (x[i] > threshold) {
      let best = x[i];
      let r = i;
      for (let j = i; j < hi && x[j] > threshold; ++j) {
        if (x[j] > best) {
          best = x[j];
          r = j;
        }
      }
      const y0 = x[r - 1], y1 = x[r], y2 = x[r + 1];
      // const denom = y2 - y1 + y0; // original
      const denom = y2 - 2 * y1 + y0; // FIXED
      if (Math.abs(denom) < 1e-6) {
        return r;
      }

      // FIXED:
      var delta = 0.5 * (y0 - y2) / denom
      if (delta < -0.5) delta = -0.5;
      if (delta > 0.5) delta = 0.5;
      return r + delta;

      // original:
      // const numer = y0 - y2;
      // return r + 0.5 * numer / denom;
    }
  }
  return 0;
}

export class DetectPitch {
  frameSize: number;
  arr: Float32Array;
  ip: Int32Array;
  w: Float32Array;
  n: number;

  constructor(frameSize: number) {
    this.frameSize = frameSize;
    this.n = nextPow2(2 * frameSize);
    this.arr = new Float32Array(this.n);
    
    // Workspace for Ooura
    // ip length recommendation from Ooura: at least 2 + sqrt(n)
    this.ip = new Int32Array(2 + Math.floor(Math.sqrt(this.n)));
    this.w = new Float32Array(this.n >>> 1);
  }

  getPeriod(signal: Float32Array, threshold?: number, start_bin?: number): number {
    if (signal.length !== this.frameSize) {
      throw new Error("Cannot find period of signal with non-frame length");
    }

    this.arr.fill(0);
    this.arr.set(signal);

    rdft(this.n, 1, this.arr, this.ip, this.w);
    squareSpectrum(this.arr);
    rdft(this.n, -1, this.arr, this.ip, this.w);
    return findPeriod(this.arr, start_bin ?? 16, this.frameSize>>>1, threshold ?? 0.9);
  }
}
