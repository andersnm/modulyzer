// Porting helpers from Q24 fixed-point math to Javascript numbers math. The
// original C++ code used integer fixed-point everywhere. The initial
// short-term goal was to optimize the slow BigInts and sine lookups in FmCore:
// this has been completed. The long-term goal is to use Javascript numbers and
// get rid of this file. Altho not critical and is more of an aestethics issue.
// Currently the sound buffers, FmCore and Lfo are ported, which also removed
// the sine lookup table. The ResoFilter is still Q24, but was not ported and
// has been disabled.
// Now the synth is usable with more than 3 voices on my humble A12, other
// things are more pressing so ... I'll leave this for now.

const Q24 = 1 << 24;

export function fromQ24(x: number): number {
  return x / Q24;
}

export function toQ24(x: number): number {
  return Math.floor(x * Q24);
}
