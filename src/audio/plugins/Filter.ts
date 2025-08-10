import { Player } from "../Player";
import { describeTable, describeUnit, Instrument, InstrumentFactory, VirtualParameter, WebAudioParameter } from "./InstrumentFactory";

const biquadFilterTypeTable: BiquadFilterType[] = [ "lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "peaking", "notch", "allpass" ]

export class FilterFactory extends InstrumentFactory {
    get identifier(): string {
        return "@modulyzer/Filter";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Filter(context, this);
    }
}

export class Filter extends Instrument {

    filterNode: BiquadFilterNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.filterNode = new BiquadFilterNode(context, { type: "lowpass", frequency: 200, Q: 0.7 });

        this.inputNode = this.filterNode;
        this.outputNode = this.filterNode;

        this.parameters = [
            new VirtualParameter("Type", 0, biquadFilterTypeTable.length - 1, 0, "linear", (time, value) => {
                this.filterNode.type = biquadFilterTypeTable[Math.round(value)];
            }, describeTable(biquadFilterTypeTable)),

            new WebAudioParameter("Cutoff", this.filterNode.frequency, "exponential", describeUnit("hz"), 100, 12000, 200),
            new WebAudioParameter("Q", this.filterNode.Q, "linear", undefined, 0.001, 20, 1),
            new WebAudioParameter("Gain", this.filterNode.gain, "linear", describeUnit("dB"), -40, 40, -3),
        ];
    }

    processMidi(time: number, command: number, value: number, data: number) {
    }
}
