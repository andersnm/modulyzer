/*
 * Copyright 2012 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Resolve frequency signal (1.0 in Q24 format = 1 octave) to phase delta.

// The LUT is just a global, and we'll need the init function to be called before
// use.

const LG_N_SAMPLES = 10
const N_SAMPLES = (1 << LG_N_SAMPLES)
const SAMPLE_SHIFT = (24 - LG_N_SAMPLES)

const MAX_LOGFREQ_INT = 20

const lut = new Array(N_SAMPLES + 1);

export class Freqlut {
  static init(sampleRate) {
    // let y = (1 << (24 + MAX_LOGFREQ_INT)) / sample_rate;
    let y = Number((1n << (24n + BigInt(MAX_LOGFREQ_INT))) / BigInt(sampleRate))

    const inc = Math.pow(2, 1.0 / N_SAMPLES);
    for (let i = 0; i < N_SAMPLES + 1; i++) {
      lut[i] = Math.floor(y + 0.5);
      y *= inc;
    }
  }

  static lookup(logfreq) {
    const ix = (logfreq & 0xffffff) >> SAMPLE_SHIFT;

    const y0 = lut[ix];
    const y1 = lut[ix + 1];
    const lowbits = logfreq & ((1 << SAMPLE_SHIFT) - 1);
    const y = y0 + Number((( BigInt(y1 - y0) * BigInt(lowbits))) >> BigInt(SAMPLE_SHIFT));
    const hibits = logfreq >> 24;
    return y >> (MAX_LOGFREQ_INT - hibits); 
  }
};
