// Inspired by HD's Combo Delay
import { Player } from "../Player";
import { describeUnit, Instrument, InstrumentFactory, WebAudioParameter } from "./InstrumentFactory";

export class ComboDelayFactory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/ComboDelay";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new ComboDelay(context, this);
    }
}

export class ComboDelay extends Instrument {

    predelayNode: DelayNode;
    delayRNode: DelayNode;
    delayLNode: DelayNode;
    splitterNode: ChannelSplitterNode;
    mergerNode: ChannelMergerNode;
    lowpassFilterNode: BiquadFilterNode;
    highpassFilterNode: BiquadFilterNode;
    wetGainNode: GainNode;
    feedbackGainNode: GainNode;
    dryGainNode: GainNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.inputNode = new GainNode(context, { gain: 1 });
        this.splitterNode = context.createChannelSplitter(2);
        this.mergerNode = context.createChannelMerger(2);

        this.predelayNode = new DelayNode(context, { delayTime: 0.05, maxDelayTime: 1 });
        this.delayRNode = new DelayNode(context, { delayTime: 0.4, maxDelayTime: 5 })
        this.delayLNode = new DelayNode(context, { delayTime: 0.3, maxDelayTime: 5 })

        this.lowpassFilterNode = new BiquadFilterNode(context, { type: "lowpass", frequency: 200, Q: 0.7 });
        this.highpassFilterNode = new BiquadFilterNode(context, { type: "highpass", frequency: 1000, Q: 0.7 });
        this.wetGainNode = new GainNode(context, { gain: 0.5 });
        this.feedbackGainNode = new GainNode(context, { gain: 0.5 });
        this.dryGainNode = new GainNode(context, { gain: 0.7 });
        this.outputNode = new GainNode(context, { gain: 1 });

        this.inputNode.connect(this.predelayNode);
        this.predelayNode.connect(this.lowpassFilterNode);
        this.lowpassFilterNode.connect(this.highpassFilterNode);
        this.highpassFilterNode.connect(this.splitterNode);

        this.splitterNode.connect(this.delayLNode, 0);
        this.splitterNode.connect(this.delayRNode, 1);

        this.delayLNode.connect(this.mergerNode, 0, 0);
        this.delayRNode.connect(this.mergerNode, 0, 1);

        // TODO: "ping-pong"?
        // this.delayLNode.connect(this.mergerNode, 0, 1);
        // this.delayRNode.connect(this.mergerNode, 0, 0);

        this.mergerNode.connect(this.wetGainNode); // one path goes to wet gain and output
        this.mergerNode.connect(this.feedbackGainNode); // other path goes to feedback gain and back to input

        this.wetGainNode.connect(this.outputNode);

        // Feed delay signal back to input, after the predelay
        this.feedbackGainNode.connect(this.lowpassFilterNode);

        // The thru/dry signal
        this.inputNode.connect(this.dryGainNode);
        this.dryGainNode.connect(this.outputNode);

        this.parameters = [
            new WebAudioParameter("Predelay", this.predelayNode.delayTime, "linear", describeUnit("ms", 1000), 0, 1, 0.2),
            new WebAudioParameter("Left Delay", this.delayLNode.delayTime, "linear", describeUnit("ms", 1000), 0.1, 5, 0.4),
            new WebAudioParameter("Right Delay", this.delayRNode.delayTime, "linear", describeUnit("ms", 1000), 0.1, 5, 0.5),
            new WebAudioParameter("Dry", this.dryGainNode.gain, "linear", describeUnit("%", 100), 0, 1, 0.5),
            new WebAudioParameter("Feedback", this.feedbackGainNode.gain, "linear", describeUnit("%", 100), 0, 1, 0.5),
            new WebAudioParameter("Lowpass Cutoff", this.lowpassFilterNode.frequency, "exponential", describeUnit("hz"), 100, 5000, 200),
            new WebAudioParameter("Highpass Cutoff", this.highpassFilterNode.frequency, "exponential", describeUnit("hz"), 100, 5000, 1000),
            new WebAudioParameter("Wet", this.wetGainNode.gain, "linear", describeUnit("%", 100), 0, 1, 0.5),
        ];
    }

    processMidi(time: number, command: number, value: number, data: number) {
    }
}
