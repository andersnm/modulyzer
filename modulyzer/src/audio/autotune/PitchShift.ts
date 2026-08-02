import { DetectPitch } from "./DetectPitch";
import { HopStream } from "./HopStream";
import { OverlapStream } from "./OverlapStream";

function createWindow(n) {
  var result = new Float32Array(n)
  for(var i=0; i<n; ++i) {
    var t = i / (n-1)
    result[i] = 0.5 * (1.0 - Math.cos(2.0*Math.PI * t))
  }
  return result
}

function normalizeWindow(w, hop_size) {
  var n = w.length
  var nh = (n / hop_size)|0
  var scale = new Float32Array(n);
  for(var i=0; i<n; ++i) {
    var s = 0.0
    for(var j=0; j<nh; ++j) {
      s += w[(i + j*hop_size)%n]
    }
    scale[i] = s
  }
  for(var i=0; i<n; ++i) {
    w[i] /= scale[i]
  }
}

//Applies window to signal
function applyWindow(X, W, frame) {
  var i, n = frame.length
  for(i=0; i<n; ++i) {
    X[i] = W[i] * frame[i]
  }
}

//Performs the actual pitch scaling
function scalePitch(out, x, nx, period, scale, shift, w) {
  var no = out.length
  for(var i=0; i<no; ++i) {
    var t  = i * scale + shift
    var ti = Math.floor(t)|0
    var tf = t - ti
    var x1 = x[ti%nx]
    var x2 = x[(ti+1)%nx]
    var v = (1.0 - tf) * x1 + tf * x2
    out[i] = w[i] * v
  }
}

//Match start/end points of signal to avoid popping artefacts
function findMatch(x, start, step) {
  var a = x[0], b = x[step], c = x[2*step]
  var n = x.length
  var best_d = 8
  var best_i = start
  for(var i=start; i<n-2*step; ++i) {
    var s = x[i]-a, t = x[i+step]-b, u=x[i+2*step]-c
    var d = s*s + t*t + u*u
    if( d < best_d ) {
      best_d = d
      best_i = i
    }
  }
  return best_i
}

export interface PitchShiftOptions {
  frameSize: number;
  hopSize: number;
  sampleRate: number;
  maxDataSize?: number;
  analysisWindow?: Float32Array;
  synthesisWindow?: Float32Array;
  freqThreshold?: number;
  minPeriod?: number;
}

export class PitchShift {
  private readonly frameSize: number;
  private readonly hopSize: number;
  private readonly sampleRate: number;
  private readonly aWindow: Float32Array;
  private readonly sWindow: Float32Array;
  private readonly startBin: number;
  private readonly threshold: number;
  private readonly onTune: (timeInSeconds: number, pitch: number) => number;
  private readonly onFrame: (frame: Float32Array) => void;
  private readonly hopStream: HopStream;
  private readonly overlapStream: OverlapStream;
  private readonly detectPitch: DetectPitch;

  private readonly cur: Float32Array;
  private t: number = 0;
  private delay: number = 0;

  constructor(onFrame: (frame: Float32Array) => void, onTune: (timeInSeconds: number, pitch: number) => number, options: PitchShiftOptions) {
    this.onFrame = onFrame;
    this.onTune = onTune;
    this.frameSize = options.frameSize;
    this.hopSize = options.hopSize
    this.sampleRate = options.sampleRate;
    this.aWindow = options.analysisWindow ?? createWindow(this.frameSize);
    this.sWindow = options.synthesisWindow ?? createWindow(this.frameSize);

    normalizeWindow(this.sWindow, this.hopSize);

    this.threshold = options.freqThreshold ?? 0.9;
    this.startBin = options.minPeriod ?? (Math.min(this.hopSize, Math.max(16, Math.round(this.sampleRate / 400))) | 0);

    this.cur = new Float32Array(this.frameSize);
    this.hopStream = new HopStream(this.frameSize, this.hopSize, this.onHopFrame, options.maxDataSize);
    this.overlapStream = new OverlapStream(this.frameSize, this.hopSize, this.onOverlapFrame);
    this.detectPitch = new DetectPitch(this.frameSize)
  }

  onHopFrame: (frame: Float32Array) => void = (frame: Float32Array) => {
    this.processFrame(frame);
  }

  onOverlapFrame: (frame: Float32Array) => void = (frame: Float32Array) => {
    this.onFrame(frame);
  }

  public push(frame: Float32Array): void {
    this.hopStream.push(frame);
  }

  processFrame(frame: Float32Array): void {
    const cur = this.cur;
    const frameSize = this.frameSize;

    applyWindow(cur, this.aWindow, frame);

    const period = this.detectPitch.getPeriod(cur, this.threshold, this.startBin);
    const pitch = period > 0 ? this.sampleRate / period : 0.0;

    const scaleF = this.onTune(this.t / this.sampleRate, pitch);

    let fsize = frameSize >> 1;
    if (period > 0) {
      fsize = (Math.max(1, Math.floor((0.5 * frameSize) / period)) * period) | 0;
    }
    fsize = findMatch(frame, fsize | 0, Math.max(1, (period / 20) | 0));

    this.delay = ((this.delay % fsize) + fsize) % fsize;

    scalePitch(cur, frame, fsize, period | 0, scaleF, this.delay, this.sWindow);

    this.delay += this.hopSize * (scaleF - 1.0);
    this.t += this.hopSize;

    this.overlapStream.push(cur);
  }
}
