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

import { Env } from "./Env"
import { Exp2 } from "./Exp2";
import { FmCore, FmOpParams } from "./FmCore"
import { Freqlut } from "./Freqlut";
import { PitchEnv } from "./PitchEnv"
import { Dx7Patch } from "./Dx7Patch";

// This is the logic to put together a note from the MIDI description
// and run the low-level modules.

// It will continue to evolve a bit, as note-stealing logic, scaling,
// and real-time control of parameters live here.

const kControllerPitch = 128;

interface Controllers {
  values_: number[];
};

function midinote_to_logfreq(midinote) {
  const base = 50857777;  // (1 << 24) * (log(440) / log(2) - 69/12)
  const step = Math.floor((1 << 24) / 12);
  return base + step * midinote;
}

const coarsemul = [
  -16777216, 0, 16777216, 26591258, 33554432, 38955489, 43368474, 47099600,
  50331648, 53182516, 55732705, 58039632, 60145690, 62083076, 63876816,
  65546747, 67108864, 68576247, 69959732, 71268397, 72509921, 73690858,
  74816848, 75892776, 76922906, 77910978, 78860292, 79773775, 80654032,
  81503396, 82323963, 83117622
];

function osc_freq(midinote: number, mode: number, coarse: number, fine: number, detune: number) {
  // TODO: pitch randomization
  let logfreq: number;
  if (mode == 0) {
    logfreq = midinote_to_logfreq(midinote);
    logfreq += coarsemul[coarse & 31];
    if (fine) {
      // (1 << 24) / log(2)
      logfreq += Math.floor(24204406.323123 * Math.log(1 + 0.01 * fine) + 0.5);
    }
    // This was measured at 7.213Hz per count at 9600Hz, but the exact
    // value is somewhat dependent on midinote. Close enough for now.
    logfreq += 12606 * (detune - 7);
  } else {
    // ((1 << 24) * log(10) / log(2) * .01) << 3
    logfreq = (4458616 * ((coarse & 3) * 100 + fine)) >> 3;
    logfreq += detune > 7 ? 13457 * (detune - 7) : 0;
  }
  return logfreq;
}

const velocity_data = [
  0, 70, 86, 97, 106, 114, 121, 126, 132, 138, 142, 148, 152, 156, 160, 163,
  166, 170, 173, 174, 178, 181, 184, 186, 189, 190, 194, 196, 198, 200, 202,
  205, 206, 209, 211, 214, 216, 218, 220, 222, 224, 225, 227, 229, 230, 232,
  233, 235, 237, 238, 240, 241, 242, 243, 244, 246, 246, 248, 249, 250, 251,
  252, 253, 254
];

// See "velocity" section of notes. Returns velocity delta in microsteps.
function ScaleVelocity(velocity: number, sensitivity: number) {
  const clamped_vel = Math.max(0, Math.min(127, velocity));
  const vel_value = velocity_data[clamped_vel >> 1] - 239;
  const scaled_vel = ((sensitivity * vel_value + 7) >> 3) << 4;
  return scaled_vel;
}

function ScaleRate(midinote: number, sensitivity: number) {
  const x = Math.min(31, Math.max(0, Math.floor(midinote / 3) - 7));
  // const x = Math.min(31, Math.max(0, midinote / 3 - 7));
  const qratedelta = (sensitivity * x) >> 3;
/*#ifdef SUPER_PRECISE
  int rem = x & 7;
  if (sensitivity == 3 && rem == 3) {
    qratedelta -= 1;
  } else if (sensitivity == 7 && rem > 0 && rem < 4) {
    qratedelta += 1;
  }
#endif*/
  return qratedelta;
}

const exp_scale_data = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 14, 16, 19, 23, 27, 33, 39, 47, 56, 66,
  80, 94, 110, 126, 142, 158, 174, 190, 206, 222, 238, 250
];

function ScaleCurve(group: number, depth: number, curve: number) {
  let scale: number;
  if (curve == 0 || curve == 3) {
    // linear
    scale = (group * depth * 329) >> 12;
  } else {
    // exponential
    const n_scale_data = exp_scale_data.length;
    const raw_exp = exp_scale_data[Math.min(group, n_scale_data - 1)];
    scale = (raw_exp * depth * 329) >> 15;
  }
  if (curve < 2) {
    scale = -scale;
  }
  return scale;
}

function ScaleLevel(midinote: number, break_pt: number, left_depth: number, right_depth: number, left_curve: number, right_curve: number) {
  const offset = midinote - break_pt - 17;
  if (offset >= 0) {
    return ScaleCurve(Math.floor(offset / 3), right_depth, right_curve);
  } else {
    return ScaleCurve(Math.floor((-offset) / 3), left_depth, left_curve);
  }
}

const pitchmodsenstab = [
  0, 10, 20, 33, 55, 92, 153, 255
];

export class Dx7Note {

  init(patch: Dx7Patch, midinote: number, velocity: number) {

    for (let op = 0; op < 6; op++) {
      const pop = patch.ops[op];

      let outlevel = pop.outlevel;
      outlevel = Env.scaleoutlevel(outlevel);
  
      const level_scaling = ScaleLevel(midinote, pop.break_pt, pop.left_depth, pop.right_depth, pop.left_curve, pop.right_curve);
      outlevel += level_scaling;
      outlevel = Math.min(127, outlevel);

      outlevel = outlevel << 5;
      outlevel += ScaleVelocity(velocity, pop.velo_sens);
      outlevel = Math.max(0, outlevel);

      const rate_scaling = ScaleRate(midinote, pop.rate_scale);
      this.env_[op].init(pop.rates, pop.levels, outlevel, rate_scaling);

      const freq = osc_freq(midinote, pop.osc_mode, pop.freq_coarse, pop.freq_fine, pop.detune);
      this.basepitch_[op] = freq;

      this.params_[op].phase = 0;
      this.params_[op].gain[1] = 0;
    }

    this.pitchenv_.set(patch.pitch_rates, patch.pitch_levels);

    this.algorithm_ = patch.algorithm;
    const feedback = patch.feedback;
    this.fb_shift_ = feedback != 0 ? 8 - feedback : 16;
    this.pitchmoddepth_ = (patch.lfo_pt_mod_dep * 165) >> 6;
    this.pitchmodsens_ = pitchmodsenstab[patch.lfo_pt_mod_sns & 7]; 
  }

  // Note: this _adds_ to the buffer. Interesting question whether it's
  // worth it...
  compute(buf: Int32Array, lfo_val: number, lfo_delay: number, ctrls: Controllers) {
    let pitchmod = this.pitchenv_.getsample();
    const pmd = this.pitchmoddepth_ * lfo_delay;  // Q32
    // TODO: add modulation sources (mod wheel, etc)
    const senslfo = this.pitchmodsens_ * (lfo_val - (1 << 23));
    pitchmod += Number((BigInt(pmd) * BigInt(senslfo)) >> 39n);
  
    // hardcodes a pitchbend range of 3 semitones, TODO make configurable
    const pitchbend = ctrls.values_[kControllerPitch];
    const pb = (pitchbend - 0x2000) << 9;
    pitchmod += pb;
    for (let op = 0; op < 6; op++) {
      this.params_[op].gain[0] = this.params_[op].gain[1];
      const level = this.env_[op].getsample();
      const gain = Exp2.lookup(level - (14 * (1 << 24)));
      //int32_t gain = pow(2, 10 + level * (1.0 / (1 << 24)));
      this.params_[op].freq = Freqlut.lookup(this.basepitch_[op] + pitchmod);
      this.params_[op].gain[1] = gain;
    }

    this.core_.compute(buf, this.params_, this.algorithm_, this.fb_buf_, this.fb_shift_); 
  }

  keyup() {
    for (let op = 0; op < 6; op++) {
      this.env_[op].keydown(false);
      this.pitchenv_.keydown(false);
    } 
  }

  // TODO: parameter changes

  // TODO: some way of indicating end-of-note. Maybe should be a return
  // value from the compute method? (Having a count return from keyup
  // is also tempting, but if there's a dynamic parameter change after
  // keyup, that won't work.

 
  private core_: FmCore = new FmCore();
  private env_ =  [ new Env(), new Env(), new Env(), new Env(), new Env(), new Env() ];
  private params_ = [new FmOpParams(), new FmOpParams(), new FmOpParams(), new FmOpParams(), new FmOpParams(), new FmOpParams(), ];
  private pitchenv_: PitchEnv = new PitchEnv();
  private basepitch_ = [0, 0, 0, 0, 0, 0];
  private fb_buf_: [number, number] = [0, 0];
  private fb_shift_: number;

  private algorithm_: number;
  private pitchmoddepth_: number;
  private pitchmodsens_: number;
};
