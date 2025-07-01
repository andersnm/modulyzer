export class Dx7PatchOp {
  rates: number[] = [ 0, 0, 0, 0 ];
  levels: number[] = [ 0, 0, 0, 0 ];
  outlevel: number = 99;
  break_pt: number = 0;
  left_depth: number = 0;
  right_depth: number = 0;
  left_curve: number = 0;
  right_curve: number = 0;
  detune: number = 0;
  rate_scale: number = 1;
  velo_sens: number = 0;
  mod_sens: number = 0;
  freq_coarse: number = 0;
  osc_mode: number = 0;
  freq_fine: number = 0;
}

export class Dx7Patch {
  ops: Dx7PatchOp[] = [
    new Dx7PatchOp(),
    new Dx7PatchOp(),
    new Dx7PatchOp(),
    new Dx7PatchOp(),
    new Dx7PatchOp(),
    new Dx7PatchOp(),
  ];

  pitch_rates: number[] = [ 0, 0, 0, 0 ];
  pitch_levels: number[] = [ 0, 0, 0, 0 ];
  algorithm: number = 0;
  key_sync: number = 0;
  feedback: number = 0;
  lfo_speed: number = 0;
  lfo_delay: number = 0;
  lfo_pt_mod_dep: number = 0;
  lfo_am_mod_dep: number = 0;
  lfo_pt_mod_sns: number = 0; // 3 bit
  wave: number = 0; // 4 bit
  sync: number = 0; // 1 bit

  transpose: number = 0; // 0..48
  name: string = "";

  setFromParameters(parameters: Record<string, Float32Array>) {
    const patch = this;

    for (let op = 0; op < 6; op++) {
      patch.ops[op].rates[0] = parameters["op" + op + "rate0"][0];
      patch.ops[op].rates[1] = parameters["op" + op + "rate1"][0];
      patch.ops[op].rates[2] = parameters["op" + op + "rate2"][0];
      patch.ops[op].rates[3] = parameters["op" + op + "rate3"][0];
      patch.ops[op].levels[0] = parameters["op" + op + "level0"][0];
      patch.ops[op].levels[1] = parameters["op" + op + "level1"][0];
      patch.ops[op].levels[2] = parameters["op" + op + "level2"][0];
      patch.ops[op].levels[3] = parameters["op" + op + "level3"][0];
      patch.ops[op].outlevel = parameters["op" + op + "outLevel"][0];
      patch.ops[op].left_depth = parameters["op" + op + "leftDepth"][0];
      patch.ops[op].right_depth = parameters["op" + op + "rightDepth"][0];
      patch.ops[op].left_curve = parameters["op" + op + "leftCurve"][0];
      patch.ops[op].right_curve = parameters["op" + op + "rightCurve"][0];
      patch.ops[op].detune = parameters["op" + op + "detune"][0];
      patch.ops[op].rate_scale = parameters["op" + op + "rateScale"][0];
      patch.ops[op].velo_sens = parameters["op" + op + "veloSens"][0];
      patch.ops[op].mod_sens = parameters["op" + op + "modSens"][0];
      patch.ops[op].freq_coarse = parameters["op" + op + "freqCoarse"][0];
      patch.ops[op].freq_fine = parameters["op" + op + "freqFine"][0];
      patch.ops[op].osc_mode = parameters["op" + op + "mode"][0];
    }
  
    patch.pitch_rates[0] = parameters["pitchRate0"][0];
    patch.pitch_rates[1] = parameters["pitchRate1"][0];
    patch.pitch_rates[2] = parameters["pitchRate2"][0];
    patch.pitch_rates[3] = parameters["pitchRate3"][0];
    patch.pitch_levels[0] = parameters["pitchLevel0"][0];
    patch.pitch_levels[1] = parameters["pitchLevel1"][0];
    patch.pitch_levels[2] = parameters["pitchLevel2"][0];
    patch.pitch_levels[3] = parameters["pitchLevel3"][0];
    patch.algorithm = parameters["algorithm"][0];
    patch.key_sync = parameters["keySync"][0];
    patch.feedback = parameters["feedback"][0];
    patch.lfo_speed = parameters["lfoSpeed"][0];
    patch.lfo_delay = parameters["lfoDelay"][0];
    patch.lfo_pt_mod_dep = parameters["pitchModDep"][0];
    patch.lfo_am_mod_dep = parameters["ampModDep"][0];
    patch.lfo_pt_mod_sns = parameters["pitchModeSens"][0];
    patch.wave = parameters["wave"][0];
    patch.sync = parameters["sync"][0];
    patch.transpose = parameters["transpose"][0];

    // console.log("Transfered patch", patch, parameters);
  }
}
