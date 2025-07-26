import { Instrument, InstrumentFactory } from "./InstrumentFactory";

export class MasterFactory extends InstrumentFactory {
    get identifier(): string {
        return "@modulyzer/Master";
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
        this.parameters = [];
    }

    processMidi(time: any, command: any, value: any, data: any) {
    }
}
