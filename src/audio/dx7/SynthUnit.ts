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

import { Dx7Note } from "./Dx7Note";
import { Exp2 } from "./Exp2";
import { Freqlut } from "./Freqlut";
import { Lfo } from "./Lfo";
import { UnpackPatch } from "./Patch";
import { PitchEnv } from "./PitchEnv";
import { ResoFilter } from "./ResoFilter";

const max_active_notes = 16;
const kControllerPitch = 128;
const LG_N = 6;
const N = (1 << LG_N);

interface ActiveNote {
  midi_note: number;
  keydown: boolean;
  sustained: boolean;
  live: boolean;
  dx7_note: Dx7Note;
}; 

const epiano = [
  95, 29, 20, 50, 99, 95, 0, 0, 41, 0, 19, 0, 115, 24, 79, 2, 0,
  95, 20, 20, 50, 99, 95, 0, 0, 0, 0, 0, 0, 3, 0, 99, 2, 0,
  95, 29, 20, 50, 99, 95, 0, 0, 0, 0, 0, 0, 59, 24, 89, 2, 0,
  95, 20, 20, 50, 99, 95, 0, 0, 0, 0, 0, 0, 59, 8, 99, 2, 0,
  95, 50, 35, 78, 99, 75, 0, 0, 0, 0, 0, 0, 59, 28, 58, 28, 0,
  96, 25, 25, 67, 99, 75, 0, 0, 0, 0, 0, 0, 83, 8, 99, 2, 0,
  
  94, 67, 95, 60, 50, 50, 50, 50, 4, 6, 34, 33, 0, 0, 56, 24,
  69, 46, 80, 73, 65, 78, 79, 32, 49, 32
];

interface Controllers {
  values_: number[];
}

export class SynthUnit {
  active_note_: ActiveNote[];
  current_note_: number;

  patch_data_ = new Int8Array(4096);
  current_patch_: number;
  unpacked_patch_ = new Int8Array(156);

  // The original DX7 had one single LFO. Later units had an LFO per note. 
  lfo_: Lfo = new Lfo();

  // in MIDI units (0x4000 is neutral) 
  controllers_: Controllers = {
    values_: new Array(129)
  };

  filter_: ResoFilter = new ResoFilter();
  filter_control_: [ number, number, number] = [ 0, 0, 0 ];
  sustain_: boolean;

  extra_buf_size_: number = 0;

  // Extra buffering for when GetSamples wants a buffer not a multiple of N
  extra_buf_ = new Int16Array(N); // [N];

  static Init(sample_rate) {
    Freqlut.init(sample_rate);
    Exp2.init();
    // Tanh::init();
    // Sin::init(); // made it implicit
    Lfo.init(sample_rate);
    PitchEnv.init(sample_rate); 
  }

  constructor() {
    this.active_note_ = new Array();
    for (let note = 0; note < max_active_notes; ++note) {
      this.active_note_[note] = {
        midi_note: 0,
        dx7_note: new Dx7Note(),
        keydown: false,
        sustained: false,
        live: false,
      };
    }
    
    for (let i = 0; i < epiano.length; i++) {
      this.patch_data_[i] = epiano[i];
    }

    this.ProgramChange(0);
    this.current_note_ = 0;
    this.filter_control_[0] = 258847126;
    this.filter_control_[1] = 0;
    this.filter_control_[2] = 0;
    this.controllers_.values_[kControllerPitch] = 0x2000;
    this.sustain_ = false;
    this.extra_buf_size_ = 0; 
  }

  GetSamples(n_samples, buffer: Float32Array) {
    let i: number;
    for (i = 0; i < n_samples && i < this.extra_buf_size_; i++) {
      buffer[i] = this.extra_buf_[i];
    } 

    if (this.extra_buf_size_ > n_samples) {
      for (let j = 0; j < this.extra_buf_size_ - n_samples; j++) {
        this.extra_buf_[j] = this.extra_buf_[j + n_samples];
      }
      this.extra_buf_size_ -= n_samples;
      return;
    } 

    for (; i < n_samples; i += N) { 
      const audiobuf = new Int32Array(N);
      const audiobuf2 = new Int32Array(N);
      const lfovalue = this.lfo_.getsample();
      const lfodelay = this.lfo_.getdelay(); 

      for (let note = 0; note < max_active_notes; ++note) {
        if (this.active_note_[note].live) {
          this.active_note_[note].dx7_note.compute(audiobuf, lfovalue, lfodelay, this.controllers_);
        }
      }

      // Dexed re-implemented the filter at the plugin-level  https://github.com/asb2m10/dexed/tree/master/Source/msfa
      this.filter_.process(audiobuf, this.filter_control_, this.filter_control_, audiobuf2); 

      // audiobuf
      let jmax = n_samples - i;
      for (let j = 0; j < N; ++j) {
        let val = audiobuf2[j] >> 4;

        let clip_val = val < -(1 << 24) ? 0x8000 : val >= (1 << 24) ? 0x7fff : val >> 9;
        // TODO: maybe some dithering?
        if (j < jmax) {
          buffer[i + j] = clip_val / 0x8000;
        } else {
          this.extra_buf_[j - jmax] = clip_val / 0x8000;
        }
      } 
      this.extra_buf_size_ = i - n_samples;
    }
  }

  AllocateNote() {
    let note = this.current_note_;
    for (let i = 0; i < max_active_notes; i++) {
      if (!this.active_note_[note].keydown) {
        this.current_note_ = (note + 1) % max_active_notes;
        return note;
      }
      note = (note + 1) % max_active_notes;
    }
    return -1;
  }

  ProgramChange(p: number) {
    this.current_patch_ = p;
    const patch = this.patch_data_.subarray(128 * this.current_patch_, 128);
    UnpackPatch(patch, this.unpacked_patch_);
    this.lfo_.reset(this.unpacked_patch_.subarray(137));
  }

  ProcessMidiMessage(buf, buf_size) {
    const cmd = buf[0];
    const cmd_type = cmd & 0xf0;
    //LOGI("got %d midi: %02x %02x %02x", buf_size, buf[0], buf[1], buf[2]);
    if (cmd_type == 0x80 || (cmd_type == 0x90 && buf[2] == 0)) {
      if (buf_size >= 3) {
        // note off
        for (let note = 0; note < max_active_notes; ++note) {
          if (this.active_note_[note].midi_note == buf[1] && 
              this.active_note_[note].keydown) {
            if (this.sustain_) {
              this.active_note_[note].sustained = true;
            } else {
              this.active_note_[note].dx7_note.keyup();
            }
            this.active_note_[note].keydown = false;
          }
        }
        return 3;
      }
      return 0;
    } else if (cmd_type == 0x90) {
      if (buf_size >= 3) {
        // note on
        const note_ix = this.AllocateNote();
        if (note_ix >= 0) {
          this.lfo_.keydown();  // TODO: should only do this if # keys down was 0
          this.active_note_[note_ix].midi_note = buf[1];
          this.active_note_[note_ix].keydown = true;
          this.active_note_[note_ix].sustained = this.sustain_;
          this.active_note_[note_ix].live = true;
          this.active_note_[note_ix].dx7_note.init(this.unpacked_patch_, buf[1], buf[2]);
        }
        return 3;
      }
      return 0; 
    } else if (cmd_type === 0xC0) {
      this.ProgramChange(buf[1]);
    }
  }
}
