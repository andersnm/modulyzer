import { Player } from "../Player";

export interface CcChangeDetail {
    instrument: Instrument;
    value: number;
    data: number;
}

export const PIN_FLAG_WAVE = 1;

export interface Pin {
    type: "controller" | "note";
    name: string;

    /** Combination of PIN_FLAG_xx constants */
    flags?: number; // 
    description?: string;
    value?: number;
    default?: number;
}

export abstract class Instrument extends EventTarget {
    factory: InstrumentFactory;
    inputNode: AudioNode | null;
    outputNode: AudioNode | null;
    pinCcs: Set<number> = new Set();

    constructor(factory: InstrumentFactory) {
        super();

        this.factory = factory;
        this.inputNode = null;
        this.outputNode = null;

        const pins = this.factory.getPins();

        for (let i = 0; i < pins.length; i++) {
            const pin = pins[i];
            if (pin.type === "controller") {
                this.pinCcs.add(pin.value);
            }
        }

    }

    sendMidi(time: number, command: number, value: number, data: number): void {
        if (command === 0xB0) {
            if (this.pinCcs.has(value)) {
                this.dispatchEvent(new CustomEvent<CcChangeDetail>("ccchange", { detail: { instrument: this, value, data } }))
            }
        }

        this.processMidi(time, command, value, data);
    }

    protected abstract processMidi(time: number, command: number, value: number, data: number): void;

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

    describeCcValue(cc: number, value: number) {
        return value.toString();
    }
}
