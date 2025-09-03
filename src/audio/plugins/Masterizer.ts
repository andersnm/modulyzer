// Inspired by Oomek's Masterizer
import { Player } from "../Player";
import { describeUnit, Instrument, InstrumentFactory, VirtualParameter, WebAudioParameter } from "./InstrumentFactory";

export class MasterizerFactory extends InstrumentFactory {
    get identifier(): string {
        return "@modulyzer/Masterizer";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Masterizer(context, this);
    }
}

export class Masterizer extends Instrument {
    context: AudioContext;
    inputGain: GainNode;
    outputGain: GainNode;

    lowFilter: BiquadFilterNode;
    midFilterLow: BiquadFilterNode;
    midFilterHigh: BiquadFilterNode;
    highFilter: BiquadFilterNode;

    lowCompressor: DynamicsCompressorNode;
    midCompressor: DynamicsCompressorNode;
    highCompressor: DynamicsCompressorNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.context = context;

        this.inputGain = context.createGain();
        this.outputGain = context.createGain();

        this.lowFilter = context.createBiquadFilter();
        this.lowFilter.type = 'lowpass';
        this.lowFilter.frequency.value = 125;

        this.midFilterLow = context.createBiquadFilter();
        this.midFilterLow.type = 'highpass';
        this.midFilterLow.frequency.value = 125;

        this.midFilterHigh = context.createBiquadFilter();
        this.midFilterHigh.type = 'lowpass';
        this.midFilterHigh.frequency.value = 1550;

        this.highFilter = context.createBiquadFilter();
        this.highFilter.type = 'highpass';
        this.highFilter.frequency.value = 1550;

        this.lowCompressor = this.createCompressor();
        this.midCompressor = this.createCompressor();
        this.highCompressor = this.createCompressor();

        // Routing
        this.inputGain.connect(this.lowFilter);
        this.inputGain.connect(this.midFilterLow);
        this.inputGain.connect(this.highFilter);

        this.lowFilter.connect(this.lowCompressor).connect(this.outputGain);
        this.midFilterLow.connect(this.midFilterHigh).connect(this.midCompressor).connect(this.outputGain);
        this.highFilter.connect(this.highCompressor).connect(this.outputGain);

        // Instrument interface
        this.inputNode = this.inputGain;
        this.outputNode = this.outputGain;
        this.parameters = [
            new WebAudioParameter("Input gain", this.inputGain.gain, "linear", describeUnit("dB"), 0.01, 10, 1),

            new WebAudioParameter("Treshold Lo", this.lowCompressor.threshold, "linear", describeUnit("dB"), -60, 60, 0),
            new WebAudioParameter("Treshold Mid", this.midCompressor.threshold, "linear", describeUnit("dB"), -60, 60, 0),
            new WebAudioParameter("Treshold Hi", this.highCompressor.threshold, "linear", describeUnit("dB"), -60, 60, 0),

            new VirtualParameter("Decay Lo", 10, 1000, 200, "linear", (time, value) => {
                this.lowCompressor.attack.value = value / 1000;
            }, describeUnit("ms")),

            new VirtualParameter("Decay Mid", 10, 1000, 200, "linear", (time, value) => {
                this.midCompressor.attack.value = value / 1000;
            }, describeUnit("ms")),

            new VirtualParameter("Decay Hi", 10, 1000, 200, "linear", (time, value) => {
                this.highCompressor.attack.value = value / 1000;
            }, describeUnit("ms")),

            new VirtualParameter("Lo | Mid Split", 50, 500, 125, "exponential", (time, value) => {
                this.lowFilter.frequency.value = value;
                this.midFilterLow.frequency.value = value;
            }, describeUnit("Hz")),

            new VirtualParameter("Mid | Hi Split", 500, 5000, 1550, "exponential", (time, value) => {
                this.midFilterHigh.frequency.value = value;
                this.highFilter.frequency.value = value;
            }, describeUnit("Hz")),

            new VirtualParameter("Knee", 0, 40, 16, "linear", (time, value) => {
                this.lowCompressor.knee.value = value;
                this.midCompressor.knee.value = value;
                this.highCompressor.knee.value = value;
            }, describeUnit("dB")),
        ];
  }

  private createCompressor(): DynamicsCompressorNode {
    const comp = this.context.createDynamicsCompressor();
    comp.threshold.value = 0; // dB
    comp.knee.value = 16;     // soft knee
    comp.ratio.value = 20;    // high ratio for limiting
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    return comp;
  }

  protected processMidi(time: number, command: number, value: number, data: number): void {
  }
}
