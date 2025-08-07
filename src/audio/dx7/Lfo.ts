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

import { Dx7Patch } from "./Dx7Patch";

// Low frequency oscillator, compatible with DX7

const LG_N = 6;
const N = (1 << LG_N);

export class Lfo {
  static unit_: number;

  phase_: number = 0;
  delta_: number = 0;
  waveform_: number = 0;
  randstate_: number = 0;
  sync_: boolean = false;

  delaystate_: number = 0;
  delayinc_: number = 0;
  delayinc2_: number = 0;

  static init(sample_rate: number) {
    // constant is 1 << 32 / 15.5s / 11
    Lfo.unit_ = N / (15.5 * 11) / sample_rate;
  }

  reset(patch: Dx7Patch) {
    const rate = patch.lfo_speed;  // 0..99
    let sr = rate == 0 ? 1 : (165 * rate) >> 6;
    sr *= sr < 160 ? 11 : (11 + ((sr - 160) >> 4));
    this.delta_ = Lfo.unit_ * sr;

    let a = 99 - patch.lfo_delay; // LFO delay
    if (a == 99) {
      this.delayinc_ = 0.9999999;
      this.delayinc2_ = 0.9999999;
    } else {
      a = (16 + (a & 15)) << (1 + (a >> 4));
      this.delayinc_ = Lfo.unit_ * a;
      a &= 0xff80;
      a = Math.max(0x80, a);
      this.delayinc2_ = Lfo.unit_ * a;
    }

    this.waveform_ = patch.wave;
    this.sync_ = patch.sync != 0;
  }

  getsample(): number {
    this.phase_ += this.delta_;
    let x: number;

    const phase = this.phase_ % 1;

    switch (this.waveform_) {
      case 0:  // triangle
        return phase < 0.5 ? phase * 2 : (0.5 - (phase - 0.5)) * 2;
      case 1:  // sawtooth down
        return 0.5 - phase;
      case 2:  // sawtooth up
        return phase - 0.5;
      case 3:  // square
        return phase < 0.5 ? 1 : 0;
      case 4:  // sine
        return 0.5 + Math.sin(2 * Math.PI * phase) / 2;
      case 5:  // sample & hold
        if (this.phase_ < this.delta_) {
          this.randstate_ = (this.randstate_ * 179 + 17) & 0xff;
        }
        x = this.randstate_ ^ 0x80;
        return (x + 1) / 256;
      default:
        return 0;
    }
  }

  getdelay(): number {
    const delta = this.delaystate_ < 0.5 ? this.delayinc_ : this.delayinc2_;
    const d = (this.delaystate_ + delta);

    if (d < this.delayinc_) {
      return 1.0;
    }

    this.delaystate_ = d;
    if (d < 0.5) {
      return 0;
    } else {
      return (d * 2) % 1;
    }
  }

  keydown() {
    if (this.sync_) {
      this.phase_ = -this.delta_; // (1 << 31) - 1;
    }
    this.delaystate_ = 0;
  }
}
