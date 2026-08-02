import { Player } from "../Player";
import { Instrument, InstrumentFactory } from "./InstrumentFactory";

export class AutotuneFactory extends InstrumentFactory {
    maxPolyphony: number = 1;

    get identifier(): string {
        return "@modulyzer/Autotune";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Autotune(context, this);
    }
}

export class Autotune extends Instrument {
    autotuneNode: AudioWorkletNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.autotuneNode = new AudioWorkletNode(context, "autotune");
        this.inputNode = this.autotuneNode;
        this.outputNode = this.autotuneNode;
        this.parameters = [];
    }

    processMidi(time: number, command: number, value: number, data: number) {
        this.autotuneNode.port.postMessage({ type: "midi", time, command, value, data});
    }

    destroy() {
        this.autotuneNode.port.postMessage({ type: "quit" });
        this.autotuneNode.disconnect();
    }
}
