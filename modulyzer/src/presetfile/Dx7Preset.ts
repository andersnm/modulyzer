import { Dx7Patch } from "../audio/dx7/Dx7Patch";
import { Bank, Preset, ParameterValueDictionary } from "../audio/SongDocument";

export function parseDx7Sysex(bulk: Int8Array): Dx7Patch {

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

    const leftrightcurves = bulk[off + 11];
    pop.left_curve = leftrightcurves & 3;
    pop.right_curve = (leftrightcurves >> 2) & 3;

    const detune_rs = bulk[off + 12];
    pop.rate_scale = detune_rs & 7;
    pop.detune = detune_rs >> 3;

    const kvs_ams = bulk[off + 13];
    pop.mod_sens = kvs_ams & 3;
    pop.velo_sens = kvs_ams >> 2;

    pop.outlevel = bulk[off + 14];

    const fcoarse_mode = bulk[off + 15];
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

  patch.name = "";
  for (let i = 0; i < 10; i++) {
    const c = bulk[118 + i];
    if (!c) break;
    patch.name += String.fromCharCode(c);
  }

  patch.name = patch.name.trimEnd();

  return patch;
}

function setPresetFromPatch(parameters: ParameterValueDictionary, patch: Dx7Patch) {
  for (let op = 0; op < 6; op++) {
    parameters["op" + op + "rate0"] = patch.ops[op].rates[0];
    parameters["op" + op + "rate1"] = patch.ops[op].rates[1];
    parameters["op" + op + "rate2"] = patch.ops[op].rates[2];
    parameters["op" + op + "rate3"] = patch.ops[op].rates[3];
    parameters["op" + op + "level0"] = patch.ops[op].levels[0];
    parameters["op" + op + "level1"] = patch.ops[op].levels[1];
    parameters["op" + op + "level2"] = patch.ops[op].levels[2];
    parameters["op" + op + "level3"] = patch.ops[op].levels[3];
    parameters["op" + op + "outLevel"] = patch.ops[op].outlevel;
    parameters["op" + op + "leftDepth"] = patch.ops[op].left_depth;
    parameters["op" + op + "rightDepth"] = patch.ops[op].right_depth;
    parameters["op" + op + "leftCurve"] = patch.ops[op].left_curve;
    parameters["op" + op + "rightCurve"] = patch.ops[op].right_curve;
    parameters["op" + op + "detune"] = patch.ops[op].detune;
    parameters["op" + op + "rateScale"] = patch.ops[op].rate_scale;
    parameters["op" + op + "veloSens"] = patch.ops[op].velo_sens;
    parameters["op" + op + "modSens"] = patch.ops[op].mod_sens;
    parameters["op" + op + "freqCoarse"] = patch.ops[op].freq_coarse;
    parameters["op" + op + "freqFine"] = patch.ops[op].freq_fine;
    parameters["op" + op + "mode"] = patch.ops[op].osc_mode;
  }

  parameters["pitchRate0"] = patch.pitch_rates[0];
  parameters["pitchRate1"] = patch.pitch_rates[1];
  parameters["pitchRate2"] = patch.pitch_rates[2];
  parameters["pitchRate3"] = patch.pitch_rates[3];
  parameters["pitchLevel0"] = patch.pitch_levels[0];
  parameters["pitchLevel1"] = patch.pitch_levels[1];
  parameters["pitchLevel2"] = patch.pitch_levels[2];
  parameters["pitchLevel3"] = patch.pitch_levels[3];
  parameters["algorithm"] = patch.algorithm;
  parameters["keySync"] = patch.key_sync;
  parameters["feedback"] = patch.feedback;
  parameters["lfoSpeed"] = patch.lfo_speed;
  parameters["lfoDelay"] = patch.lfo_delay;
  parameters["pitchModDep"] = patch.lfo_pt_mod_dep;
  parameters["ampModDep"] = patch.lfo_am_mod_dep;
  parameters["pitchModeSens"] = patch.lfo_pt_mod_sns;
  parameters["wave"] = patch.wave;
  parameters["sync"] = patch.sync;
  parameters["transpose"] = patch.transpose;

  console.log("Patched parameters from patch", parameters);
}

function convertDx7PatchToPreset(patch: Dx7Patch): Preset {

    const preset: ParameterValueDictionary = {};
    setPresetFromPatch(preset, patch)

    return {
        name: patch.name,
        parameters: preset,
    };
}

// import from a local file:
export function convertDx7Bank(buffer: ArrayBuffer, name: string): Bank {
    let offset = 0;
    if (buffer.byteLength === 4104) {
        offset = 6;
        // TODO: validate first bytes are F0, 43, 00, 09, 20, 00
    } else if ((buffer.byteLength % 128) !== 0) {
        throw new Error("Expected sysex length mod 128 or exactly 4104 byes");
    }

    const bank: Bank = {
      name: name,
      presets: [],
    };

    for (let i = offset; i < buffer.byteLength; i += 128) {
        const data = new Int8Array(buffer, i, Math.min(128, buffer.byteLength - i));
        const patch = parseDx7Sysex(data);
        const preset = convertDx7PatchToPreset(patch);

        bank.presets.push(preset);
    }

    return bank;
}
