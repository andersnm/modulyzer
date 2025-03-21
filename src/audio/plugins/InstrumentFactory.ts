import { Player } from "../Player";

export const PIN_FLAG_WAVE = 1;

export interface Pin {
    type: "controller" | "note";
    name: string;

    /** Combination of PIN_FLAG_xx constants */
    flags?: number; // 
    description?: string;
    value?: number;
}

export abstract class Instrument {
    factory: InstrumentFactory;
    inputNode: AudioNode | null;
    outputNode: AudioNode | null;

    constructor(factory: InstrumentFactory) {
        this.factory = factory;
        this.inputNode = null;
        this.outputNode = null;
    }

    abstract sendMidi(time: number, command: number, value: number, data: number): void;

    connect(destination: Instrument) {
        this.outputNode.connect(destination.inputNode);
    }

    disconnect(destination: Instrument) {
        this.outputNode.disconnect(destination.inputNode);
    }
}

export abstract class InstrumentFactory {
    abstract getIdentifier(): string;
    abstract getInputChannelCount(): number;
    abstract getOutputChannelCount(): number;
    abstract getPins(): Pin[];
    abstract createInstrument(context: AudioContext, player: Player): Instrument;
}
