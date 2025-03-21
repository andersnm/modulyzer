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

import { Sin } from "./Sin";

// Low frequency oscillator, compatible with DX7

const LG_N = 6;
const N = (1 << LG_N);

export class Lfo {
  static unit_: number;

  phase_: number;  // Q32
  delta_: number;
  waveform_: number;
  randstate_: number;
  sync_: boolean;

  delaystate_: number;
  delayinc_: number;
  delayinc2_: number;

  static init(sample_rate: number) {
    // constant is 1 << 32 / 15.5s / 11
    Lfo.unit_ = Math.floor(N * 25190424 / sample_rate + 0.5);
  }

  // params[6]
  reset(params: Int8Array) {
    const rate = params[0];  // 0..99
    let sr = rate == 0 ? 1 : (165 * rate) >> 6;
    sr *= sr < 160 ? 11 : (11 + ((sr - 160) >> 4));
    this.delta_ = Lfo.unit_ * sr;
    let a = 99 - params[1];  // LFO delay
    if (a == 99) {
      console.log("THIS IS PROBABLY WRONG")
      this.delayinc_ = 0xffffffff; // ~0u; <- was uint32_t
      this.delayinc2_ = 0xffffffff; // ~0u;
    } else {
      a = (16 + (a & 15)) << (1 + (a >> 4));
      this.delayinc_ = Lfo.unit_ * a;
      a &= 0xff80;
      a = Math.max(0x80, a);
      this.delayinc2_ = Lfo.unit_ * a;
    }
    this.waveform_ = params[5];
    this.sync_ = params[4] != 0;
  }

  getsample(): number {
    this.phase_ += this.delta_;
    let x: number;
    switch (this.waveform_) {
      case 0:  // triangle
        x = this.phase_ >> 7;
        x ^= -(this.phase_ >> 31);
        x &= (1 << 24) - 1;
        return x;
      case 1:  // sawtooth down
        return (~this.phase_ ^ (1 << 31)) >> 8;
      case 2:  // sawtooth up
        return (this.phase_ ^ (1 << 31)) >> 8;
      case 3:  // square
        return ((~this.phase_) >> 7) & (1 << 24);
      case 4:  // sine
        return (1 << 23) + (Sin.lookup(this.phase_ >> 8) >> 1);
      case 5:  // s&h
        if (this.phase_ < this.delta_) {
          this.randstate_ = (this.randstate_ * 179 + 17) & 0xff;
        }
        x = this.randstate_ ^ 0x80;
        return (x + 1) << 16;
    }
    return 1 << 23;
  }

  getdelay() {
    let delta = this.delaystate_ < (1 << 31) ? this.delayinc_ : this.delayinc2_;
    let d = this.delaystate_ + delta;
    if (d < this.delayinc_) {
      return 1 << 24;
    }
    this.delaystate_ = d;
    if (d < (1 << 31)) {
      return 0;
    } else {
      return (d >> 7) & ((1 << 24) - 1);
    }
  }

  keydown() {
    if (this.sync_) {
      this.phase_ = (1 << 31) - 1;
    }
    this.delaystate_ = 0;
  } 
}