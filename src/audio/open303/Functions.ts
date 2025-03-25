export function dB2amp(dB: number): number {
  return Math.pow(10, dB / 20);
}

export function linToExp(input: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin * Math.exp((input - inMin) / (inMax - inMin) * Math.log(outMax / outMin));
}

export function linToLin(value: number, minSrc: number, maxSrc: number, minDst: number, maxDst: number): number {
  return ((value - minSrc) / (maxSrc - minSrc)) * (maxDst - minDst) + minDst;
}

export function expToLin(value: number, minSrc: number, maxSrc: number, minDst: number, maxDst: number): number {
  return Math.log(value / minSrc) / Math.log(maxSrc / minSrc) * (maxDst - minDst) + minDst;
}


// function pitchToFreq(pitch)
// {
//   return 8.1757989156437073336828122976033 * Math.exp(0.057762265046662109118102676788181*pitch);
//   //return 440.0*( pow(2.0, (pitch-69.0)/12.0) ); // naive, slower but numerically more precise
// }

export function pitchToFreq(pitch: number, masterTuneA4 = 440) {
  return masterTuneA4 * 0.018581361171917516667460937040007 * Math.exp(0.057762265046662109118102676788181 * pitch);
}
