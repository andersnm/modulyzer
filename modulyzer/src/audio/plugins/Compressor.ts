import { Player } from "../Player";
import { describeUnit, Instrument, InstrumentFactory, WebAudioParameter } from "./InstrumentFactory";

export class CompressorFactory extends InstrumentFactory {
    get identifier(): string {
        return "@modulyzer/Compressor";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Compressor(context, this);
    }
}

export class Compressor extends Instrument {

    compressorNode: DynamicsCompressorNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.compressorNode = new DynamicsCompressorNode(context, {
            threshold: -24,
            knee: 30,
            ratio: 12,
            attack: 0.003,
            release: 0.25
        });

        this.inputNode = this.compressorNode;
        this.outputNode = this.compressorNode;

        this.parameters = [
            new WebAudioParameter("Threshold", this.compressorNode.threshold, "linear", describeUnit("dB"), -100, 0, -24),
            new WebAudioParameter("Knee", this.compressorNode.knee, "linear", describeUnit("dB"), 0, 40, 30),
            new WebAudioParameter("Ratio", this.compressorNode.ratio, "linear", undefined, 1, 20, 12),
            new WebAudioParameter("Attack", this.compressorNode.attack, "exponential", describeUnit("s"), 0.001, 1, 0.003),
            new WebAudioParameter("Release", this.compressorNode.release, "exponential", describeUnit("s"), 0.01, 1, 0.25),
        ];
    }

    processMidi(time: number, command: number, value: number, data: number) {
    }
}
