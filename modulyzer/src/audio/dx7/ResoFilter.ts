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

// Resonant filter implementation. This closely follows "Non-Linear
// Digital Implementation of the Moog Ladder Filter" by Antti
// Huovilainen, 2004.

// The full implementation requires both a tuning table and 2x
// oversampling, neither of which are present yet, but we'll get there.  

import { LG_N, N } from "./FmCore";
import { Freqlut } from "./Freqlut";

function compute_alpha(logf: number) {
  return Math.min(1 << 24, Freqlut.lookup(logf));
} 

export class ResoFilter {
  x: [number, number, number, number] = [ 0, 0, 0, 0 ];
  process(ibuf: Int32Array, control_in: number[], control_last: number[], obuf: Int32Array) {
    let alpha = compute_alpha(control_last[0]);
    const alpha_in = compute_alpha(control_in[0]);
    const delta_alpha = (alpha_in - alpha) >> LG_N;
    let k = control_last[1];
    let k_in = control_in[1];
    const delta_k = (k_in - k) >> LG_N;
    if (((BigInt(alpha_in) * BigInt(k_in)) >> 24n) > 1n << 24n) {
      k_in = Number(((1n << 30n) / BigInt(alpha_in)) << 18n);
      // k_in = ((1 << 30) / alpha_in) << 18;
    }
    if (((BigInt(alpha) * BigInt(k)) >> 24n) > 1n << 24n) {
      k = Number(((1n << 30n) / BigInt(alpha_in)) << 18n);
      // k = ((1 << 30) / alpha) << 18;
    }
    // const ibuf = inbufs[0];
    // const obuf = outbufs[0];
    let x0 = this.x[0];
    let x1 = this.x[1];
    let x2 = this.x[2];
    let x3 = this.x[3];

    for (let i = 0; i < N; i++) {
      alpha += delta_alpha;
      k += delta_k;
      const signal = ibuf[i];

      const fb = Number((BigInt(k) * BigInt(x3)) >> 24n);

      x0 = x0 + Number((BigInt(signal - fb - x0) * BigInt(alpha)) >> 24n);
      x1 = x1 + Number((BigInt(x0 - x1) * BigInt(alpha)) >> 24n);
      x2 = x2 + Number((BigInt(x1 - x2) * BigInt(alpha)) >> 24n);
      x3 = x3 + Number((BigInt(x2 - x3) * BigInt(alpha)) >> 24n);

      obuf[i] = x3;
    }

    this.x[0] = x0;
    this.x[1] = x1;
    this.x[2] = x2;
    this.x[3] = x3;

  }
}
