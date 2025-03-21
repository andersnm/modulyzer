import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

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
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Reverb(context, this);
    }
}

function impulseResponse(audioContext: AudioContext, duration, decay, reverse ) {
    // https://stackoverflow.com/a/34482734
    var sampleRate = audioContext.sampleRate;
    var length = sampleRate * duration;
    var impulse = audioContext.createBuffer(2, length, sampleRate);
    var impulseL = impulse.getChannelData(0);
    var impulseR = impulse.getChannelData(1);

    if (!decay)
        decay = 2.0;
    for (var i = 0; i < length; i++){
      var n = reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
    }
    return impulse;
}

export class Reverb extends Instrument {
    reverbNode: ConvolverNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.reverbNode = context.createConvolver();
        this.reverbNode.buffer = impulseResponse(context, 1, 0.2, false)

        this.inputNode = this.reverbNode;
        this.outputNode = this.reverbNode;
    }

    sendMidi(time: any, command: any, value: any, data: any) {
    }
}
