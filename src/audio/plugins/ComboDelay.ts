import { linToExp, linToLin } from "../open303/Functions";
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
                name: "Left Delay (ms)",
                value: 0,
                default: 15,
            },
            {
                type: "controller",
                name: "Right Delay (ms)",
                value: 1,
                default: 25,
            },
            {
                type: "controller",
                name: "Dry Gain",
                value: 2,
            },
            {
                type: "controller",
                name: "Delay Gain",
                value: 3,
            },
            {
                type: "controller",
                name: "Lowpass Cutoff",
                value: 4,
                default: 32,
            },
            {
                type: "controller",
                name: "Highpass Cutoff",
                value: 5,
                default: 48,
            },

        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new ComboDelay(context, this);
    }

    describeCcValue(cc: number, value: number): string {
        switch (cc) {
            case 0:
            case 1:
                return linToLin(value, 0, 127, 0.1, 5) + "s";
            case 4:
                return linToExp(value, 0, 127, 100, 5000).toFixed(2) + " hz";
            case 5:
                return linToExp(value, 0, 127, 100, 5000).toFixed(2) + " hz";
        }
        return super.describeCcValue(cc, value);
    }
}

export class ComboDelay extends Instrument {

    delayRNode: DelayNode;
    delayLNode: DelayNode;
    splitterNode: ChannelSplitterNode;
    mergerNode: ChannelMergerNode;
    lowpassFilterNode: BiquadFilterNode;
    highpassFilterNode: BiquadFilterNode;
    delayGainNode: GainNode;
    dryGainNode: GainNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.inputNode = new GainNode(context, { gain: 1 });
        this.splitterNode = context.createChannelSplitter(2);
        this.mergerNode = context.createChannelMerger(2);

        this.delayRNode = new DelayNode(context, { delayTime: 0.4, maxDelayTime: 5 })
        this.delayLNode = new DelayNode(context, { delayTime: 0.3, maxDelayTime: 5 })

        this.lowpassFilterNode = new BiquadFilterNode(context, { type: "lowpass", frequency: 200, Q: 0.7 });
        this.highpassFilterNode = new BiquadFilterNode(context, { type: "highpass", frequency: 1000, Q: 0.7 });
        this.delayGainNode = new GainNode(context, { gain: 0.5 });
        this.dryGainNode = new GainNode(context, { gain: 0.7 });
        this.outputNode = new GainNode(context, { gain: 1 });

        this.inputNode.connect(this.lowpassFilterNode);
        this.lowpassFilterNode.connect(this.highpassFilterNode);
        this.highpassFilterNode.connect(this.splitterNode);

        this.splitterNode.connect(this.delayLNode, 0);
        this.splitterNode.connect(this.delayRNode, 1);

        this.delayLNode.connect(this.mergerNode, 0, 0);
        this.delayRNode.connect(this.mergerNode, 0, 1);
        this.mergerNode.connect(this.delayGainNode);

        this.delayGainNode.connect(this.outputNode);

        // Feed delay signal back to input
        this.delayGainNode.connect(this.lowpassFilterNode, 0);

        // The thru/dry signal
        this.inputNode.connect(this.dryGainNode);
        this.dryGainNode.connect(this.outputNode);
    }

    processMidi(time: number, command: number, value: number, data: number) {
        if (command === 0xB0) {
            switch (value) {
                case 0: // left delay ms (max 5sec per DelayNode maxDelayTime)
                    this.delayLNode.delayTime.setValueAtTime(linToLin(data, 0, 127, 0.1, 5), time);
                    break;
                case 1: // right delay ms (max 5sec per DelayNode maxDelayTime)
                    this.delayRNode.delayTime.setValueAtTime(linToLin(data, 0, 127, 0.1, 5), time);
                    break;
                case 2: // dry gain (thru)
                    this.dryGainNode.gain.setValueAtTime(linToLin(data, 0, 127, 0, 1), time);
                    break;
                case 3: // delay gain (after filter, before fed back to input)
                    this.delayGainNode.gain.setValueAtTime(linToLin(data, 0, 127, 0, 1), time);
                    break;
                case 4:
                    this.lowpassFilterNode.frequency.setValueAtTime(linToExp(data, 0, 127, 100, 5000), time);
                    break;
                case 5:
                    this.highpassFilterNode.frequency.setValueAtTime(linToExp(data, 0, 127, 100, 5000), time);
                    break;
            }
        }
    }
}
