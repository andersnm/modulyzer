import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

export class MasterFactory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/Master";
    }

    getInputChannelCount(): number {
        return 1;
    }

    getOutputChannelCount(): number {
        return 0;
    }

    getPins(): Pin[] {
        return [];
    }

    createInstrument(context: AudioContext): Instrument {
        return new Master(context, this);
    }
}

export class Master extends Instrument {
    context: AudioContext;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);
        this.outputNode = null;
        this.inputNode = context.destination;
    }

    processMidi(time: any, command: any, value: any, data: any) {
    }
}
