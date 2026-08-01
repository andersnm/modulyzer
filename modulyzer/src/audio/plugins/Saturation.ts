// Inspired by HD's Saturation
import { Player } from "../Player";
import { Instrument, InstrumentFactory, VirtualParameter } from "./InstrumentFactory";

export class SaturationFactory extends InstrumentFactory {
    get identifier(): string {
        return "@modulyzer/Saturation";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Saturation(context, this);
    }
}

export class Saturation extends Instrument {
    private waveShaper: WaveShaperNode;

    amount: number = 1;
    volumeTarget: number = 0.5;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.waveShaper = context.createWaveShaper();

        this.inputNode = this.waveShaper;
        this.outputNode = this.waveShaper;

        this.parameters = [
            new VirtualParameter("Amount", 0, 1, 1, "linear", (time, value) => {
                this.amount = value;
                this.waveShaper.curve = this.makeSaturationCurve(this.amount, this.volumeTarget);
            }),

            new VirtualParameter("Volume Target", 0, 1, 0.5, "linear", (time, value) => {
                this.volumeTarget = value;
                this.waveShaper.curve = this.makeSaturationCurve(this.amount, this.volumeTarget);
            }),
        ];
    }

    makeSaturationCurve(gain: number, target: number) {
        const samples = 512;
        const curve = new Float32Array(samples);

        for (let i = 0; i < samples; i++) {
            const x = (i / (samples - 1)) * 2 - 1;
            const scaled = x / gain;
            const shaped = scaled * gain / (Math.abs(scaled) * (1 - target) + target);
            curve[i] = shaped;
        }

        return curve;
    }

    protected processMidi(time: number, command: number, value: number, data: number): void {
    }
}
