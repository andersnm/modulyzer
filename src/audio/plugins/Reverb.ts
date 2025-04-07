import { linToLin } from "../open303/Functions";
import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

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

    getInputChannelCount(): number {
        return 1;
    }

    getOutputChannelCount(): number {
        return 1;
    }

    getPins(): Pin[] {
        return [
            { type: "controller", name: "Dry Gain", value: 0, default: 64 },
            { type: "controller", name: "Wet Gain", value: 1, default: 64 },
            { type: "controller", name: "Reverb Duration", value: 2, default: 20 },
            { type: "controller", name: "Decay Factor", value: 3, default: 16 },
            { type: "controller", name: "Stereo Width", value: 4, default: 32 },
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Reverb(context, this);
    }

    describeCcValue(cc: number, value: number): string {
        switch (cc) {
            case 0: // Dry Gain
            case 1: // Wet Gain
                return linToLin(value, 0, 127, 0, 1).toFixed(2);
            case 2: // Reverb Duration
                return linToLin(value, 0, 127, 0.1, 5).toFixed(2) + "s";
            case 3: // Decay Factor
                return linToLin(value, 0, 127, 0.1, 5).toFixed(2);
            case 4: // Stereo Width
                return linToLin(value, 0, 127, 0.5, 2).toFixed(2);
        }
        return super.describeCcValue(cc, value);
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
    }

    regenerateImpulseResponse = debounce(() => {
        this.reverbNode.buffer = impulseResponse(this.context, this.reverbDuration, this.reverbDecay, false, this.reverbWidth);
    }, 200);

    processMidi(time: any, command: any, value: any, data: any) {
        if (command === 0xB0) {
            switch (value) {
                case 0: // Dry gain
                    this.dryGainNode.gain.setValueAtTime(linToLin(data, 0, 127, 0, 1), time);
                    break;
                case 1: // Wet gain
                    this.wetGainNode.gain.setValueAtTime(linToLin(data, 0, 127, 0, 1), time);
                    break;
                case 2: // Reverb Duration
                    this.reverbDuration = linToLin(data, 0, 127, 0.1, 5);
                    this.regenerateImpulseResponse();
                    break;
                case 3: // Decay Factor
                    this.reverbDecay = linToLin(data, 0, 127, 0.1, 5);
                    this.regenerateImpulseResponse();
                    break;
                case 4: // Stereo Width
                    this.reverbWidth = linToLin(data, 0, 127, 0.5, 2);
                    this.regenerateImpulseResponse();
                    break;
            }
        }
    }
}
