import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

export class ComboDelayFactory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/ComboDelay";
    }

    getInputChannelCount(): number {
        return 1;
    }

    getOutputChannelCount(): number {
        return 1;
    }

    getPins(): Pin[] {
        return [
            {
                type: "controller",
                name: "Delay (ms)",
                value: 0,
            },
            {
                type: "controller",
                name: "Delay Gain",
                value: 1,
            },
            {
                type: "controller",
                name: "Dry Gain",
                value: 2,
            },
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new ComboDelay(context, this);
    }
}

export class ComboDelay extends Instrument {

    delayNode: DelayNode;
    delayFilterNode: BiquadFilterNode;
    delayGainNode: GainNode;
    dryGainNode: GainNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.inputNode = new GainNode(context, { gain: 1 });
        this.delayNode = new DelayNode(context, { delayTime: 0.4, maxDelayTime: 5 })
        this.delayFilterNode = new BiquadFilterNode(context, { type: "lowshelf", frequency: 500, Q: 1, gain: -6 });
        this.delayGainNode = new GainNode(context, { gain: 0.5 });
        this.dryGainNode = new GainNode(context, { gain: 0.7 });
        this.outputNode = new GainNode(context, { gain: 1 });

        this.inputNode.connect(this.delayNode);
        this.delayNode.connect(this.delayFilterNode);
        this.delayFilterNode.connect(this.delayGainNode);
        this.delayGainNode.connect(this.outputNode);

        // TODO; feed delay signal back to input
        this.delayGainNode.connect(this.delayNode);

        this.inputNode.connect(this.dryGainNode);
        this.dryGainNode.connect(this.outputNode);
    }

    processMidi(time: number, command: number, value: number, data: number) {
        // controller 0-3 mapped per pins
        if (command === 0xB0) {
            switch (value) {
                case 0:
                    this.delayNode.delayTime.setValueAtTime(data, time);
                    break;
                case 1:
                    // controller #1; delay ms
                    this.delayGainNode.gain.setValueAtTime(value, time);
                    break;
            }
        }
    }
}
