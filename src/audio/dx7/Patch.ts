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

export function ParseSysex(bulk: ArrayLike<number>): Dx7Patch {

  // https://homepages.abdn.ac.uk/d.j.benson/pages/dx7/sysex-format.txt
  const patch = new Dx7Patch();

  for (let op = 0; op < 6; op++) {
    const off = op * 17;

    const pop = patch.ops[op];

    for (let i = 0; i < 4; i++) {
      pop.rates[i] = bulk[off + i];
      pop.levels[i] = bulk[off + 4 + i];
    }

    pop.break_pt = bulk[off + 8];
    pop.left_depth = bulk[off + 9];
    pop.right_depth = bulk[off + 10];

    const leftrightcurves = bulk[op * 17 + 11];
    pop.left_curve = leftrightcurves & 3;
    pop.right_curve = (leftrightcurves >> 2) & 3;

    const detune_rs = bulk[op * 17 + 12];
    pop.rate_scale = detune_rs & 7;
    pop.detune = detune_rs >> 3;

    const kvs_ams = bulk[op * 17 + 13];
    pop.mod_sens = kvs_ams & 3;
    pop.velo_sens = kvs_ams >> 2;

    pop.outlevel = bulk[off + 14];

    const fcoarse_mode = bulk[op * 17 + 15];
    pop.osc_mode = fcoarse_mode & 1;
    pop.freq_coarse = fcoarse_mode >> 1;

    pop.freq_fine = bulk[off + 16];
  }

  for (let i = 0; i < 4; i++) {
    patch.pitch_rates[i] = bulk[102 + i];
    patch.pitch_levels[i] = bulk[102 + 4 + i];
  }

  patch.algorithm = bulk[110];

  const oks_fb = bulk[111];
  patch.key_sync = oks_fb >> 3;
  patch.feedback = oks_fb & 7;

  patch.lfo_speed = bulk[112];
  patch.lfo_delay = bulk[113];
  patch.lfo_pt_mod_dep = bulk[114];
  patch.lfo_am_mod_dep = bulk[115];

  const lpms_lfw_lks = bulk[116];
  patch.lfo_pt_mod_sns = lpms_lfw_lks >> 4;
  patch.wave = (lpms_lfw_lks >> 1) & 7;
  patch.sync = lpms_lfw_lks & 1;
  patch.transpose = bulk[117];

  return patch;
}
