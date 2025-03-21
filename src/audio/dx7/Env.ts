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

import { LG_N } from "./FmCore";

// DX7 envelope generation

export class Env {
  // The rates and levels arrays are calibrated to match the Dx7 parameters
  // (ie, value 0..99). The outlevel parameter is calibrated in microsteps
  // (ie units of approx .023 dB), with 99 * 32 = nominal full scale. The
  // rate_scaling parameter is in qRate units (ie 0..63).
  init(rates: number[], levels: number[], outlevel: number, rate_scaling: number) {
    for (let i = 0; i < 4; i++) {
        this.rates_[i] = rates[i];
        this.levels_[i] = levels[i];
      }
      this.outlevel_ = outlevel;
      this.rate_scaling_ = rate_scaling;
      this.level_ = 0;
      this.down_ = true;
      this.advance(0); 
  }

  // Result is in Q24/doubling log format. Also, result is subsampled
  // for every N samples.
  // A couple more things need to happen for this to be used as a gain
  // value. First, the # of outputs scaling needs to be applied. Also,
  // modulation.
  // Then, of course, log to linear.
  getsample() {
    if (this.ix_ < 3 || (this.ix_ < 4) && !this.down_) {
        if (this.rising_) {
          const jumptarget = 1716;
          if (this.level_ < (jumptarget << 16)) {
            this.level_ = jumptarget << 16;
          }
          this.level_ += (((17 << 24) - this.level_) >> 24) * this.inc_;
          // TODO: should probably be more accurate when inc is large
          if (this.level_ >= this.targetlevel_) {
            this.level_ = this.targetlevel_;
            this.advance(this.ix_ + 1);
          }
        } else {  // !rising
          this.level_ -= this.inc_;
          if (this.level_ <= this.targetlevel_) {
            this.level_ = this.targetlevel_;
            this.advance(this.ix_ + 1);
          }
        }
      }
      // TODO: this would be a good place to set level to 0 when under threshold
      return this.level_;
  }

  keydown(down: boolean) {
    if (this.down_ != down) {
        this.down_ = down;
        this.advance(down ? 0 : 3);
      } 
  }
  
  setparam(param: number, value: number) {
    if (param < 4) {
        this.rates_[param] = value;
      } else if (param < 8) {
        this.levels_[param - 4] = value;
      }
      // Unknown parameter, ignore for now 
  }

  static scaleoutlevel(outlevel: number) {
    const levellut = [
        0, 5, 9, 13, 17, 20, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 42, 43, 45, 46
    ];
    return outlevel >= 20 ? 28 + outlevel : levellut[outlevel]; 
  }

  private rates_ = [0,0,0,0];//int[4];
  private levels_ = [0,0,0,0]; //int[4];
  private outlevel_: number;
  private rate_scaling_: number;
  // Level is stored so that 2^24 is one doubling, ie 16 more bits than
  // the DX7 itself (fraction is stored in level rather than separate
  // counter)
  private level_: number;
  private targetlevel_: number;
  private rising_: boolean;
  private ix_: number;
  private inc_: number;

  private down_: boolean;

  advance(newix: number) {
    this.ix_ = newix;
    if (this.ix_ < 4) {
      const newlevel = this.levels_[this.ix_];
      let actuallevel = Env.scaleoutlevel(newlevel) >> 1;
      actuallevel = (actuallevel << 6) + this.outlevel_ - 4256;
      actuallevel = actuallevel < 16 ? 16 : actuallevel;
      // level here is same as Java impl
      this.targetlevel_ = actuallevel << 16;
      this.rising_ = (this.targetlevel_ > this.level_);
  
      // rate
      let qrate = (this.rates_[this.ix_] * 41) >> 6;
      qrate += this.rate_scaling_;
      qrate = Math.min(qrate, 63);
      this.inc_ = (4 + (qrate & 3)) << (2 + LG_N + (qrate >> 2));
    } 
  }
};


 