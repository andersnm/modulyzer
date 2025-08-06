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

// const SIN_LG_N_SAMPLES = 10;
// const SIN_N_SAMPLES = (1 << SIN_LG_N_SAMPLES);
// const R  = (1 << 29);

// const sintab = new Int32Array(SIN_N_SAMPLES + 1);

export class Sin {

  // static init() {
  //   const dphase = 2 * Math.PI / SIN_N_SAMPLES;
  //   const c = Math.floor(Math.cos(dphase) * (1 << 30) + 0.5);
  //   const s = Math.floor(Math.sin(dphase) * (1 << 30) + 0.5);
  //   let u = 1 << 30;
  //   let v = 0;
  //   for (let i = 0; i < SIN_N_SAMPLES / 2; i++) {
  //     sintab[i] = (v + 32) >> 6;
  //     sintab[i + SIN_N_SAMPLES / 2] = -((v + 32) >> 6);

  //     const t = Number((BigInt(u) * BigInt(s) + BigInt(v) * BigInt(c) + BigInt(R)) >> 30n);
  //     u = Number((BigInt(u) * BigInt(c) - BigInt(v) * BigInt(s) + BigInt(R)) >> 30n);
  //     v = t;
  //   }
  //   sintab[SIN_N_SAMPLES] = 0;
  // }

  // static lookup(phase: number) {
  //   const SHIFT = 24 - SIN_LG_N_SAMPLES;
  //   const lowbits = phase & ((1 << SHIFT) - 1);
  //   const phase_int = (phase >> SHIFT) & (SIN_N_SAMPLES - 1);
  //   const y0 = sintab[phase_int];
  //   const y1 = sintab[phase_int + 1];

  //   return y0 + Number(  (( BigInt(y1 - y0) * BigInt(lowbits)) >> BigInt(SHIFT)) );
  // }

  static lookup(phase: number) {
    // Table Lookup: 380.20 ms; result checksum = 3105031809373
    // Math.sin(): 84.00 ms; result checksum = 3105041515060
    const normalizedPhase = (phase >>> 0) / (1 << 24);
    const radians = normalizedPhase * 2 * Math.PI;
    return Math.floor(Math.sin(radians) * (1 << 24));
  }

}

// Sin.init();