import { Player } from "../Player";
import { describeUnit, Instrument, InstrumentFactory, VirtualParameter, WebAudioParameter } from "./InstrumentFactory";

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timer: number | undefined;
    return function (...args: Parameters<T>) {
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => func(...args), wait);
    };
}

export class ReverbFactory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/Reverb";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Reverb(context, this);
    }
}

function impulseResponse(audioContext: AudioContext, duration, decay, reverse, width ) {
    // https://stackoverflow.com/a/34482734
    var sampleRate = audioContext.sampleRate;
    var length = sampleRate * duration;
    var impulse = audioContext.createBuffer(2, length, sampleRate);
    var impulseL = impulse.getChannelData(0);
    var impulseR = impulse.getChannelData(1);
    const normalizationFactor = 1 / Math.sqrt(1 + Math.pow(width, 2));

    if (!decay)
        decay = 2.0;
    for (var i = 0; i < length; i++){
      var n = reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay) * normalizationFactor;
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay) * width * normalizationFactor;
    }
    return impulse;
}

export class Reverb extends Instrument {
    context: AudioContext;
    dryGainNode: GainNode;
    wetGainNode: GainNode;
    inputGainNode: GainNode;
    outputGainNode: GainNode;
    reverbNode: ConvolverNode;

    reverbDuration: number = 1;
    reverbDecay: number = 0.2;
    reverbWidth: number = 1.1;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.context = context;

        this.inputGainNode = new GainNode(context, { gain: 1 });
        this.reverbNode = context.createConvolver();
        this.reverbNode.buffer = impulseResponse(context, 1, 0.2, false, 1.1)

        this.dryGainNode = new GainNode(context, { gain: 0.7 });
        this.wetGainNode = new GainNode(context, { gain: 0.5 });
        this.outputGainNode = new GainNode(context, { gain: 1 });

        this.inputGainNode.connect(this.reverbNode);
        this.reverbNode.connect(this.wetGainNode);
        this.wetGainNode.connect(this.outputGainNode);

        // dry signal
        this.inputGainNode.connect(this.dryGainNode);
        this.dryGainNode.connect(this.outputGainNode);

        this.inputNode = this.inputGainNode;
        this.outputNode = this.outputGainNode;

        this.parameters = [
            new WebAudioParameter("Dry", this.dryGainNode.gain, "linear", describeUnit("%", 100), 0, 1, 0.7),
            new WebAudioParameter("Wet", this.wetGainNode.gain, "linear", describeUnit("%", 100), 0, 1, 0.5),
            new VirtualParameter("Duration", 0.1, 5, 0.5, "linear", (time, value) => {
                this.reverbDuration = value;
                this.regenerateImpulseResponse();
            }),
            new VirtualParameter("Decay", 0.1, 5, 0.5, "linear", (time, value) => {
                this.reverbDecay = value;
                this.regenerateImpulseResponse();
            }),
            new VirtualParameter("Stereo", 0.5, 2, 0.5, "linear", (time, value) => {
                this.reverbWidth = value;
                this.regenerateImpulseResponse();
            }),
        ]
    }

    regenerateImpulseResponse = debounce(() => {
        this.reverbNode.buffer = impulseResponse(this.context, this.reverbDuration, this.reverbDecay, false, this.reverbWidth);
    }, 200);

    processMidi(time: any, command: any, value: any, data: any) {
    }
}
