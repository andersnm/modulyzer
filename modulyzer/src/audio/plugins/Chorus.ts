import { Player } from "../Player";
import { describeUnit, Instrument, InstrumentFactory, VirtualParameter, WebAudioParameter } from "./InstrumentFactory";

// Bing Copilot wrote 90% of this

export class ChorusFactory extends InstrumentFactory {
    get identifier(): string {
        return "@modulyzer/Chorus";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Chorus(context, this);
    }
}

export class Chorus extends Instrument {
    private dryGain: GainNode;
    private wetGain: GainNode;
    private delayNodes: DelayNode[] = [];
    private lfoOscillators: OscillatorNode[] = [];
    private lfoGains: GainNode[] = [];
    private panners: StereoPannerNode[] = [];
    private feedbackGains: GainNode[] = [];

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        const input = context.createGain();
        const output = context.createGain();
        this.inputNode = input;
        this.outputNode = output;

        this.dryGain = context.createGain();
        this.wetGain = context.createGain();
        this.dryGain.gain.value = 0.7;
        this.wetGain.gain.value = 0.3;

        input.connect(this.dryGain).connect(output);

        const voiceCount = 3;
        const baseDelay = 0.02;
        const depths = [0.005, 0.007, 0.006];
        const rates = [0.25, 0.33, 0.2];
        const pans = [-0.5, 0, 0.5]; // stereo spread

        for (let i = 0; i < voiceCount; i++) {
            const delay = context.createDelay();
            delay.delayTime.value = baseDelay;

            const lfo = context.createOscillator();
            const lfoGain = context.createGain();
            lfoGain.gain.value = depths[i];
            lfo.frequency.value = rates[i];

            const feedbackGain = context.createGain();
            feedbackGain.gain.value = 0.2; // default feedback

            const panner = context.createStereoPanner();
            panner.pan.value = pans[i];

            // Connect LFO to delay modulation
            lfo.connect(lfoGain).connect(delay.delayTime);
            lfo.start();

            // Feedback loop
            delay.connect(feedbackGain).connect(delay);

            // Wet signal routing
            input.connect(delay).connect(panner).connect(this.wetGain);

            this.delayNodes.push(delay);
            this.lfoOscillators.push(lfo);
            this.lfoGains.push(lfoGain);
            this.panners.push(panner);
            this.feedbackGains.push(feedbackGain);
        }

        this.wetGain.connect(output);

        this.parameters = [
            new WebAudioParameter("Dry", this.dryGain.gain, "linear", describeUnit("%", 100), 0, 1, 0.7),
            new WebAudioParameter("Wet", this.wetGain.gain, "linear", describeUnit("%", 100), 0, 1, 0.3),
            new VirtualParameter("Depth", 0.005, 0.02, 0.007, "linear", (time, value) => {
                this.lfoGains.forEach(gain => gain.gain.setValueAtTime(value, time));
            }, describeUnit("ms", 1000)),
            new VirtualParameter("Rate", 0.2, 1.0, 0.33, "linear", (time, value) => {
                this.lfoOscillators.forEach(osc => osc.frequency.setValueAtTime(value, time));
            }, describeUnit("hz")),
            new VirtualParameter("Spread", -1.0, 1.0, 0.5, "linear", (time, value) => {
                const step = value / (this.panners.length - 1);
                this.panners.forEach((panner, i) => {
                    panner.pan.setValueAtTime(-value + step * i * 2, time);
                });
            }),
            new VirtualParameter("Feedback", 0.0, 0.9, 0.2, "linear", (time, value) => {
                this.feedbackGains.forEach(gain => gain.gain.setValueAtTime(value, time));
            }, describeUnit("%", 100))
        ];
    }

    processMidi(time: number, command: number, value: number, data: number) {
    }
}
