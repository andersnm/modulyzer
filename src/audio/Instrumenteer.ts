import { Instrument, InstrumentFactory } from "./plugins/InstrumentFactory";

export class Instrumenteer {
    factory: InstrumentFactory;
    instrument: Instrument;
    gainNode: GainNode;
    muted: boolean = false;

    constructor(factory: InstrumentFactory, instrument: Instrument, context: AudioContext) {
        this.factory = factory;
        this.instrument = instrument;

        if (instrument.outputNode) {
            this.gainNode = context.createGain();
            this.gainNode.gain.value = 1.0;

            instrument.outputNode.connect(this.gainNode);
        }
    }

    connect(destination: AudioNode) {
        if (!this.gainNode) {
            throw new Error("Instrument has no output node");
        }

        this.gainNode.connect(destination);
    }

    disconnect(destination: AudioNode) {
        if (!this.gainNode) {
            throw new Error("Instrument has no output node");
        }

        this.gainNode.disconnect(destination);
    }

    setMuted(muted: boolean) {
        this.muted = muted;
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(muted ? 0.0 : 1.0, 0);
        }
    }
}
