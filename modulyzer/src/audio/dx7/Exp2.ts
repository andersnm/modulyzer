/*
 * Copyright 2013 Google Inc.
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

const EXP2_LG_N_SAMPLES = 10
const EXP2_N_SAMPLES = (1 << EXP2_LG_N_SAMPLES)

const exp2tab = new Int32Array(EXP2_N_SAMPLES << 1);

function exp2(v) {
  return Math.pow(2, v);
}

export class Exp2 {

  static init() {
    const inc = exp2(1.0 / EXP2_N_SAMPLES);
    let y = 1 << 30;
    for (let i = 0; i < EXP2_N_SAMPLES; i++) {
      exp2tab[(i << 1) + 1] = Math.floor(y + 0.5);
      y *= inc;
    }
    for (let i = 0; i < EXP2_N_SAMPLES - 1; i++) {
      exp2tab[i << 1] = exp2tab[(i << 1) + 3] - exp2tab[(i << 1) + 1];
    }
    exp2tab[(EXP2_N_SAMPLES << 1) - 2] = (1 << 31) - exp2tab[(EXP2_N_SAMPLES << 1) - 1]; 
  }

  // Q24 in, Q24 out
  static lookup(x: number) {
    const SHIFT = 24 - EXP2_LG_N_SAMPLES;
    const lowbits = x & ((1 << SHIFT) - 1);
    const x_int = (x >> (SHIFT - 1)) & ((EXP2_N_SAMPLES - 1) << 1);

    const dy = exp2tab[x_int];
    const y0 = exp2tab[x_int + 1];
  
    const y = y0 + Number((BigInt(dy) * BigInt(lowbits)) >> BigInt(SHIFT));
    return y >> (6 - (x >> 24)); 
  }
};

Exp2.init();
