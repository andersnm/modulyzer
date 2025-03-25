import { AnalogEnvelope } from "./AnalogEnvelope";
import { BiquadFilter } from "./BiquadFilter";
import { BlendOscillator } from "./BlendOscillator";
import { DecayEnvelope } from "./DecayEnvelope";
import { EllipticQuarterBandFilter } from "./EllipticQuarterBandFilter";
import { LeakyIntegrator } from "./LeakyIntegrator";
import { MipMappedWaveTable } from "./MipMappedWavetable";
import { OnePoleFilter } from "./OnePoleFilter";
import { TeeBeeFilter } from "./TeeBeeFilter";

// function pitchToFreq(pitch)
// {
//   return 8.1757989156437073336828122976033 * Math.exp(0.057762265046662109118102676788181*pitch);
//   //return 440.0*( pow(2.0, (pitch-69.0)/12.0) ); // naive, slower but numerically more precise
// }

function pitchToFreq(pitch, masterTuneA4 = 440)
{
  return masterTuneA4 * 0.018581361171917516667460937040007
    * Math.exp(0.057762265046662109118102676788181*pitch);
}

export class Open303 {
  static oversampling = 4;

  private tuning: number = 440.0;
  private ampScaler: number = 1.0;
  private oscFreq: number = 440.0;
  private sampleRate: number = 44100.0;
  private level: number = -12.0;
  private levelByVel: number = 12.0;
  private accent: number = 0.0;
  private slideTime: number = 60.0;
  private cutoff: number = 1000.0;
  private envUpFraction: number = 2.0 / 3.0;
  private normalAttack: number = 3.0;
  private accentAttack: number = 3.0;
  private normalDecay: number = 1000.0;
  private accentDecay: number = 200.0;
  private normalAmpRelease: number = 1.0;
  private accentAmpRelease: number = 50.0;
  private accentGain: number = 0.0;
  private pitchWheelFactor: number = 1.0;
  private currentNote: number = -1;
  private currentVel: number = 0;
  private noteOffCountDown: number = 0;
  private slideToNextNote: boolean = false;
  private idle: boolean = true;

  private envMod: number = 25.0;
  private envScaler: number = 1.0;
  private envOffset: number = 0.0;

  private n1: number = 1.0;
  private n2: number = 1.0;

  // Components (these need to be implemented or mocked separately)
  private oscillator: BlendOscillator;
  private waveTable1: MipMappedWaveTable;
  private waveTable2: MipMappedWaveTable;
  private mainEnv: DecayEnvelope;
  private ampEnv: AnalogEnvelope;
  private pitchSlewLimiter: LeakyIntegrator;
  private ampDeClicker: BiquadFilter;
  private rc1: LeakyIntegrator;
  private rc2: LeakyIntegrator;
  private highpass1: OnePoleFilter;
  private highpass2: OnePoleFilter;
  private allpass: OnePoleFilter;
  private notch: BiquadFilter;
  private filter: TeeBeeFilter;
  private antiAliasFilter: EllipticQuarterBandFilter;
  // private sequencer: AcidSequencer;
  private noteList: {note,velocity}[];

  constructor() {
    this.initializeComponents();

    this.setEnvMod(this.envMod);

    this.oscillator.setWaveTable1(this.waveTable1);
    this.oscillator.setWaveForm1(MipMappedWaveTable.SAW303);
    this.oscillator.setWaveTable2(this.waveTable2);
    this.oscillator.setWaveForm2(MipMappedWaveTable.SQUARE303);

    this.mainEnv.setNormalizeSum(false);

    this.ampEnv.setAttack(0.0);
    this.ampEnv.setDecay(1230.0);
    this.ampEnv.setSustainLevel(0.0);
    this.ampEnv.setRelease(0.5);
    this.ampEnv.setTauScale(1.0);

    this.pitchSlewLimiter.setTimeConstant(60.0);
    this.ampDeClicker.setMode(BiquadFilter.LOWPASS12);
    this.ampDeClicker.setGain(this.ampToDb(Math.sqrt(0.5)));
    this.ampDeClicker.setFrequency(200.0);

    this.rc1.setTimeConstant(0.0);
    this.rc2.setTimeConstant(15.0);

    this.highpass1.setMode(OnePoleFilter.HIGHPASS);
    this.highpass2.setMode(OnePoleFilter.HIGHPASS);
    this.allpass.setMode(OnePoleFilter.ALLPASS);
    this.notch.setMode(BiquadFilter.BANDREJECT);

    this.setSampleRate(this.sampleRate);

    this.oscillator.setPulseWidth(50.0);
    this.highpass1.setCutoff(44.486);
    this.highpass2.setCutoff(24.167);
    this.allpass.setCutoff(14.008);
    this.notch.setFrequency(7.5164);
    this.notch.setBandwidth(4.7);

    this.filter.setFeedbackHighpassCutoff(150.0);
  }

  private initializeComponents(): void {
    this.oscillator = new BlendOscillator();
    this.waveTable1 = new MipMappedWaveTable();
    this.waveTable2 = new MipMappedWaveTable();
    this.mainEnv = new DecayEnvelope();
    this.ampEnv = new AnalogEnvelope();
    this.pitchSlewLimiter = new LeakyIntegrator();
    this.ampDeClicker = new BiquadFilter();
    this.rc1 = new LeakyIntegrator();
    this.rc2 = new LeakyIntegrator();
    this.highpass1 = new OnePoleFilter();
    this.highpass2 = new OnePoleFilter();
    this.allpass = new OnePoleFilter();
    this.notch = new BiquadFilter();
    this.filter = new TeeBeeFilter();
    this.antiAliasFilter = new EllipticQuarterBandFilter();
    // this.sequencer = new ;
    this.noteList = []; /*{
      clear: () => {},
      remove: (note: any) => {},
      empty: () => true,
      front: () => ({ getKey: () => -1, getVelocity: () => 0 }),
      push_front: (note: any) => {},
    };*/
  }

  setSampleRate(newSampleRate: number): void {
    this.mainEnv.setSampleRate(newSampleRate);
    this.ampEnv.setSampleRate(newSampleRate);
    this.pitchSlewLimiter.setSampleRate(newSampleRate);
    this.ampDeClicker.setSampleRate(newSampleRate);
    this.rc1.setSampleRate(newSampleRate);
    this.rc2.setSampleRate(newSampleRate);
    // this.sequencer.setSampleRate(newSampleRate);

    this.highpass2.setSampleRate(newSampleRate);
    this.allpass.setSampleRate(newSampleRate);
    this.notch.setSampleRate(newSampleRate);

    const oversampling = 4; // Example value
    this.highpass1.setSampleRate(oversampling * newSampleRate);

    this.oscillator.setSampleRate(oversampling * newSampleRate);
    this.filter.setSampleRate(oversampling * newSampleRate);
  }

  setEnvMod(newEnvMod: number): void {
    this.envMod = newEnvMod;
    this.calculateEnvModScalerAndOffset();
  }

  setCutoff(newCutoff: number): void {
    this.cutoff = newCutoff;
    this.calculateEnvModScalerAndOffset();
  }

  setResonance(newResonance) {
    this.filter.setResonance(newResonance);
  }

  setAccent(newAccent)
  {
    this.accent = 0.01 * newAccent;
  }
  
  setDecay(newDecay) { 
    this.normalDecay = newDecay;
  }

  setMainEnvDecay(newDecay: number)
  {
    this.mainEnv.setDecayTimeConstant(newDecay);
    this.updateNormalizer1();
    this.updateNormalizer2();
  }
  
  private calculateEnvModScalerAndOffset(): void {
    const measuredMapping = true;
    if (measuredMapping) {
      const c0 = 313.8152786059267;
      const c1 = 2394.411986817546;
      const oF = 0.048292930943553;
      const oC = 0.294391201442418;
      const sLoF = 3.773996325111173;
      const sLoC = 0.736965594166206;
      const sHiF = 4.194548788411135;
      const sHiC = 0.864344900642434;

      const e = this.linToLin(this.envMod, 0.0, 100.0, 0.0, 1.0);
      const c = this.expToLin(this.cutoff, c0, c1, 0.0, 1.0);
      const sLo = sLoF * e + sLoC;
      const sHi = sHiF * e + sHiC;
      this.envScaler = (1 - c) * sLo + c * sHi;
      this.envOffset = oF * c + oC;
    } else {
      const upRatio = this.pitchOffsetToFreqFactor(this.envUpFraction * this.envMod);
      const downRatio = this.pitchOffsetToFreqFactor(-(1.0 - this.envUpFraction) * this.envMod);
      this.envScaler = upRatio - downRatio;
      this.envOffset =
        this.envScaler !== 0.0 ? -(downRatio - 1.0) / (upRatio - downRatio) : 0.0;
    }
  }

  private linToLin(value: number, minSrc: number, maxSrc: number, minDst: number, maxDst: number): number {
    return ((value - minSrc) / (maxSrc - minSrc)) * (maxDst - minDst) + minDst;
  }

  private expToLin(value: number, minSrc: number, maxSrc: number, minDst: number, maxDst: number): number {
    return Math.log(value / minSrc) / Math.log(maxSrc / minSrc) * (maxDst - minDst) + minDst;
  }

  private pitchOffsetToFreqFactor(offset: number): number {
    return Math.pow(2, offset / 12);
  }

  private ampToDb(amplitude: number): number {
    return 20 * Math.log10(amplitude);
  }

  getSample(): number {
    // Return 0 if idle
    if (this.idle) {
      return 0.0;
    }
  
    // Check the sequencer if there's a note to trigger
    // if (this.sequencer.getSequencerMode() !== "OFF") {
    //   this.noteOffCountDown--;
    //   if (this.noteOffCountDown === 0 || !this.sequencer.isRunning()) {
    //     this.releaseNote(this.currentNote);
    //   }
  
    //   const note = this.sequencer.getNote();
    //   if (note) {
    //     if (note.gate === true && this.currentNote !== -1) {
    //       let key = note.key + 12 * note.octave + this.currentNote;
    //       key = this.clip(key, 0, 127);
  
    //       if (!this.slideToNextNote) {
    //         this.triggerNote(key, note.accent);
    //       } else {
    //         this.slideToNote(key, note.accent);
    //       }
  
    //       const nextNote = this.sequencer.getNextScheduledNote();
    //       if (note.slide && nextNote?.gate === true) {
    //         this.noteOffCountDown = Number.MAX_SAFE_INTEGER;
    //         this.slideToNextNote = true;
    //       } else {
    //         this.noteOffCountDown = this.sequencer.getStepLengthInSamples();
    //         this.slideToNextNote = false;
    //       }
    //     }
    //   }
    // }
  
    // Calculate instantaneous oscillator frequency and set it up
    const instFreq = this.pitchSlewLimiter.getSample(this.oscFreq);
    this.oscillator.setFrequency(instFreq * this.pitchWheelFactor);
    this.oscillator.calculateIncrement();
  
    // Calculate instantaneous cutoff frequency and set up the filter
    const mainEnvOut = this.mainEnv.getSample();
    let tmp1 = this.n1 * this.rc1.getSample(mainEnvOut);
    let tmp2 = 0.0;
    if (this.accentGain > 0.0) {
      tmp2 = mainEnvOut;
    }
    tmp2 = this.n2 * this.rc2.getSample(tmp2);
    tmp1 = this.envScaler * (tmp1 - this.envOffset);
    tmp2 = this.accentGain * tmp2;
    const instCutoff = this.cutoff * Math.pow(2.0, tmp1 + tmp2);
    this.filter.setCutoff(instCutoff);
  
    // Process amplitude envelope
    let ampEnvOut = this.ampEnv.getSample();
    if (this.ampEnv.isNoteOn()) {
      ampEnvOut += 0.45 * mainEnvOut + this.accentGain * 4.0 * mainEnvOut;
    }
    ampEnvOut = this.ampDeClicker.getSample(ampEnvOut);
  
    // Oversampled calculations
    let tmp = 0.0;
    for (let i = 1; i <= Open303.oversampling; i++) {
      tmp = -this.oscillator.getSample(); // Raw oscillator signal
      tmp = this.highpass1.getSample(tmp); // Pre-filter highpass
      tmp = this.filter.getSample(tmp); // Filtered signal
      tmp = this.antiAliasFilter.getSample(tmp); // Anti-aliasing filter
    }
  
    // Post-oversampling processing
    tmp = this.allpass.getSample(tmp);
    tmp = this.highpass2.getSample(tmp);
    tmp = this.notch.getSample(tmp);
    tmp *= ampEnvOut; // Apply amplitude envelope
    tmp *= this.ampScaler; // Apply overall amplitude scaling
  
    // Update idle status
    this.idle = false;
  
    // Return the final sample
    return tmp;
  }

  
  noteOn(noteNumber: number, velocity: number, detune: number): void {
    // If the sequencer mode was changed, turn off all notes
    // if (this.sequencer.modeWasChanged()) {
    //   this.allNotesOff();
    // }
  
    // // Handle sequencer-based notes
    // if (this.sequencer.getSequencerMode() !== "OFF") {
    //   if (velocity === 0) {
    //     this.sequencer.stop();
    //     this.releaseNote(this.currentNote);
    //     this.currentNote = -1;
    //     this.currentVel = 0;
    //   } else {
    //     this.sequencer.start();
    //     this.noteOffCountDown = Number.MAX_SAFE_INTEGER;
    //     this.slideToNextNote = false;
    //     this.currentNote = noteNumber;
    //     this.currentVel = velocity;
    //   }
    //   this.idle = false;
    //   return;
    // }
  
    // Handle MIDI-based notes
    if (velocity === 0) {
      // Velocity zero indicates a note-off event
      this.noteList.pop();
      // this.noteList.remove({ key: noteNumber, velocity: 0 }); // Mocked note object
      if (!this.noteList.length) {
        this.currentNote = -1;
        this.currentVel = 0;
      } else {
        const frontNote = this.noteList[this.noteList.length - 1]; //.front();
        this.currentNote = frontNote.note; // getKey();
        this.currentVel = frontNote.velocity; // getVelocity();
      }
      this.releaseNote();
    } else {
      // Note-on event
      if (!this.noteList.length) {
        this.triggerNote(noteNumber, velocity >= 100);
      } else {
        this.slideToNote(noteNumber, velocity >= 100);
      }
  
      this.currentNote = noteNumber;
      this.currentVel = velocity;
  
      // Add the new note to the note list
      this.noteList.push({ note: noteNumber, velocity });
    }
    this.idle = false;
  }
  
  allNotesOff(): void {
    // Clear all notes and reset the amplitude envelope
    this.noteList.length = 0;
    this.ampEnv.noteOff();
    this.currentNote = -1;
    this.currentVel = 0;
  }
  
  triggerNote(noteNumber: number, hasAccent: boolean): void {
    // Retrigger oscillator and reset filter buffers if idle
    if (this.idle) {
      this.oscillator.resetPhase();
      this.filter.reset();
      this.highpass1.reset();
      this.highpass2.reset();
      this.allpass.reset();
      this.notch.reset();
      this.antiAliasFilter.reset();
      this.ampDeClicker.reset();
    }
  
    // Set parameters based on accent state
    if (hasAccent) {
      this.accentGain = this.accent;
      this.setMainEnvDecay(this.accentDecay);
      this.ampEnv.setRelease(this.accentAmpRelease);
    } else {
      this.accentGain = 0.0;
      this.setMainEnvDecay(this.normalDecay);
      this.ampEnv.setRelease(this.normalAmpRelease);
    }
  
    this.oscFreq = pitchToFreq(noteNumber, this.tuning);
    this.pitchSlewLimiter.setState(this.oscFreq);
    this.mainEnv.trigger();
    this.ampEnv.noteOn(true, noteNumber, 64);
    this.idle = false;
  }
  
  slideToNote(noteNumber: number, hasAccent: boolean): void {
    this.oscFreq = pitchToFreq(noteNumber, this.tuning);
  
    // Set parameters based on accent state
    if (hasAccent) {
      this.accentGain = this.accent;
      this.setMainEnvDecay(this.accentDecay);
      this.ampEnv.setRelease(this.accentAmpRelease);
    } else {
      this.accentGain = 0.0;
      this.setMainEnvDecay(this.normalDecay);
      this.ampEnv.setRelease(this.normalAmpRelease);
    }
    this.idle = false;
  }
  
  releaseNote(): void {
    // Check if the note list is empty
    if (!this.noteList.length) {
      this.ampEnv.noteOff();
    } else {
      // Slide back to the most recent held note
      this.oscFreq = pitchToFreq(this.currentNote);
    }
  }

  updateNormalizer1()
  {
    this.n1 = LeakyIntegrator.getNormalizer(this.mainEnv.getDecayTimeConstant(), this.rc1.getTimeConstant(),
      sampleRate);
    this.n1 = 1.0; // test
  }
  
  updateNormalizer2()
  {
    this.n2 = LeakyIntegrator.getNormalizer(this.mainEnv.getDecayTimeConstant(), this.rc2.getTimeConstant(),
      sampleRate);
    this.n2 = 1.0; // test
  }
  
}
