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

import { Sin } from "./Sin";

// TODO(raph): move from fixed to variable N 
export const LG_N = 6
export const N  = (1 << LG_N)

export class FmOpParams {
  gain: [number, number] = [0, 0];
  freq: number = 0;
  phase: number = 0;
};

// enum FmOperatorFlags {
const OUT_BUS_ONE = 1 << 0;
const OUT_BUS_TWO = 1 << 1;
const OUT_BUS_ADD = 1 << 2;
const IN_BUS_ONE = 1 << 4;
const IN_BUS_TWO = 1 << 5;
const FB_IN = 1 << 6;
const FB_OUT = 1 << 7;

interface FmAlgorithm {
  ops: [ number, number, number, number, number, number ];
}

const algorithms: FmAlgorithm[] = [
  { ops: [ 0xc1, 0x11, 0x11, 0x14, 0x01, 0x14 ] }, // 1
  { ops: [ 0x01, 0x11, 0x11, 0x14, 0xc1, 0x14 ] }, // 2
  { ops: [ 0xc1, 0x11, 0x14, 0x01, 0x11, 0x14 ] }, // 3
  { ops: [ 0x41, 0x11, 0x94, 0x01, 0x11, 0x14 ] }, // 4
  { ops: [ 0xc1, 0x14, 0x01, 0x14, 0x01, 0x14 ] }, // 5
  { ops: [ 0x41, 0x94, 0x01, 0x14, 0x01, 0x14 ] }, // 6
  { ops: [ 0xc1, 0x11, 0x05, 0x14, 0x01, 0x14 ] }, // 7
  { ops: [ 0x01, 0x11, 0xc5, 0x14, 0x01, 0x14 ] }, // 8
  { ops: [ 0x01, 0x11, 0x05, 0x14, 0xc1, 0x14 ] }, // 9
  { ops: [ 0x01, 0x05, 0x14, 0xc1, 0x11, 0x14 ] }, // 10
  { ops: [ 0xc1, 0x05, 0x14, 0x01, 0x11, 0x14 ] }, // 11
  { ops: [ 0x01, 0x05, 0x05, 0x14, 0xc1, 0x14 ] }, // 12
  { ops: [ 0xc1, 0x05, 0x05, 0x14, 0x01, 0x14 ] }, // 13
  { ops: [ 0xc1, 0x05, 0x11, 0x14, 0x01, 0x14 ] }, // 14
  { ops: [ 0x01, 0x05, 0x11, 0x14, 0xc1, 0x14 ] }, // 15
  { ops: [ 0xc1, 0x11, 0x02, 0x25, 0x05, 0x14 ] }, // 16
  { ops: [ 0x01, 0x11, 0x02, 0x25, 0xc5, 0x14 ] }, // 17
  { ops: [ 0x01, 0x11, 0x11, 0xc5, 0x05, 0x14 ] }, // 18
  { ops: [ 0xc1, 0x14, 0x14, 0x01, 0x11, 0x14 ] }, // 19
  { ops: [ 0x01, 0x05, 0x14, 0xc1, 0x14, 0x14 ] }, // 20
  { ops: [ 0x01, 0x14, 0x14, 0xc1, 0x14, 0x14 ] }, // 21
  { ops: [ 0xc1, 0x14, 0x14, 0x14, 0x01, 0x14 ] }, // 22
  { ops: [ 0xc1, 0x14, 0x14, 0x01, 0x14, 0x04 ] }, // 23
  { ops: [ 0xc1, 0x14, 0x14, 0x14, 0x04, 0x04 ] }, // 24
  { ops: [ 0xc1, 0x14, 0x14, 0x04, 0x04, 0x04 ] }, // 25
  { ops: [ 0xc1, 0x05, 0x14, 0x01, 0x14, 0x04 ] }, // 26
  { ops: [ 0x01, 0x05, 0x14, 0xc1, 0x14, 0x04 ] }, // 27
  { ops: [ 0x04, 0xc1, 0x11, 0x14, 0x01, 0x14 ] }, // 28
  { ops: [ 0xc1, 0x14, 0x01, 0x14, 0x04, 0x04 ] }, // 29
  { ops: [ 0x04, 0xc1, 0x11, 0x14, 0x04, 0x04 ] }, // 30
  { ops: [ 0xc1, 0x14, 0x04, 0x04, 0x04, 0x04 ] }, // 31
  { ops: [ 0xc4, 0x04, 0x04, 0x04, 0x04, 0x04 ] }, // 32
];

function n_out(alg: FmAlgorithm) {
  let count = 0;
  for (let i = 0; i < 6; i++) {
    if ((alg.ops[i] & 7) == OUT_BUS_ADD) count++;
  }
  return count;
} 

function FmOpKernel_compute(output: Int32Array, input: Int32Array,
                         phase0: number, freq: number,
                         gain1: number, gain2: number, add: boolean)
{
  const dgain = (gain2 - gain1 + (N >> 1)) >> LG_N;
  let gain = gain1;
  let phase = phase0;
  if (add) {
    for (let i = 0; i < N; i++) {
      gain += dgain;
      const y = Sin.lookup(phase + input[i]);
      output[i] += Number((BigInt(y) * BigInt(gain)) >> 24n);
      phase += freq;
    }
  } else {
    for (let i = 0; i < N; i++) {
      gain += dgain;
      const y = Sin.lookup(phase + input[i]);
      output[i] = Number((BigInt(y) * BigInt(gain)) >> 24n);
      phase += freq;
    }
  }
}

function FmOpKernel_compute_pure(output: Int32Array, phase0: number, freq: number,
                              gain1: number, gain2: number, add: boolean) {
  const dgain = (gain2 - gain1 + (N >> 1)) >> LG_N;
  let gain = gain1;
  let phase = phase0;
  if (add) {
    for (let i = 0; i < N; i++) {
      gain += dgain;
      const y = Sin.lookup(phase);
      output[i] += Number((BigInt(y) * BigInt(gain)) >> 24n);
      phase += freq;
    }
  } else {
    for (let i = 0; i < N; i++) {
      gain += dgain;
      const y = Sin.lookup(phase);
      output[i] = Number((BigInt(y) * BigInt(gain)) >> 24n);
      phase += freq;
    }
  }
}

function FmOpKernel_compute_fb(output: Int32Array, phase0: number, freq: number,
                            gain1: number, gain2: number,
                            fb_buf: number[], fb_shift: number, add: boolean) {


  const dgain = (gain2 - gain1 + (N >> 1)) >> LG_N;
  let gain = gain1;
  let phase = phase0;
  let y0 = fb_buf[0];
  let y = fb_buf[1];
  if (add) {
    for (let i = 0; i < N; i++) {
      gain += dgain;
      const scaled_fb = (y0 + y) >> (fb_shift + 1);
      y0 = y;
      y = Sin.lookup(phase + scaled_fb);
      y = Number((BigInt(y) * BigInt(gain)) >> 24n);
      output[i] += y;
      phase += freq;
    }
  } else {
    for (let i = 0; i < N; i++) {
      gain += dgain;
      const scaled_fb = (y0 + y) >> (fb_shift + 1);
      y0 = y;
      y = Sin.lookup(phase + scaled_fb);
      y = Number((BigInt(y) * BigInt(gain)) >> 24n);
      output[i] = y;
      phase += freq;
    }
  }
  fb_buf[0] = y0;
  fb_buf[1] = y;
} 

export class FmCore {
    static dump(): any {
        /* for (int i = 0; i < 32; i++) {
            cout << (i + 1) << ":";
            const FmAlgorithm &alg = algorithms[i];
            for (int j = 0; j < 6; j++) {
              int flags = alg.ops[j];
              cout << " ";
              if (flags & FB_IN) cout << "[";
              cout << (flags & IN_BUS_ONE ? "1" : flags & IN_BUS_TWO ? "2" : "0") << "->";
              cout << (flags & OUT_BUS_ONE ? "1" : flags & OUT_BUS_TWO ? "2" : "0");
              if (flags & OUT_BUS_ADD) cout << "+";
              //cout << alg.ops[j].in << "->" << alg.ops[j].out;
              if (flags & FB_OUT) cout << "]";
            }
            cout << " " << n_out(alg);
            cout << endl;
          } */
    }

    compute(output: Int32Array, params: FmOpParams[], algorithm: number, fb_buf: [number, number], feedback_shift: number): any {
        const kLevelThresh = 1120;

        const alg = algorithms[algorithm];
        const has_contents: [boolean, boolean, boolean] =  [ true, false, false ];
        for (let op = 0; op < 6; op++) {
          const flags = alg.ops[op];
          let add = (flags & OUT_BUS_ADD) != 0;
          const param = params[op];
          const inbus = (flags >> 4) & 3;
          const outbus = flags & 3;
          const outptr = (outbus == 0) ? output : this.buf_[outbus - 1];
          const gain1 = param.gain[0];
          const gain2 = param.gain[1];
          if (gain1 >= kLevelThresh || gain2 >= kLevelThresh) {
            if (!has_contents[outbus]) {
              add = false;
            }
            if (inbus == 0 || !has_contents[inbus]) {
              // todo: more than one op in a feedback loop
              if ((flags & 0xc0) == 0xc0 && feedback_shift < 16) {
                // cout << op << " fb " << inbus << outbus << add << endl;
                FmOpKernel_compute_fb(outptr, param.phase, param.freq,
                                       gain1, gain2,
                                       fb_buf, feedback_shift, add);
              } else {
                // cout << op << " pure " << inbus << outbus << add << endl;
                FmOpKernel_compute_pure(outptr, param.phase, param.freq,
                                         gain1, gain2, add);
              }
            } else {
              // cout << op << " normal " << inbus << outbus << " " << param.freq << add << endl;
              FmOpKernel_compute(outptr, this.buf_[inbus - 1],
                                  param.phase, param.freq, gain1, gain2, add);
            }
            has_contents[outbus] = true;
          } else if (!add) {
            has_contents[outbus] = false;
          }
          param.phase += param.freq << LG_N;
        } 
    }
    buf_: [Int32Array, Int32Array] = [ new Int32Array(N), new Int32Array(N) ];
};
