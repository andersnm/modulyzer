import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

export class Open303Factory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/Open303";
    }

    getInputChannelCount(): number {
        return 1;
    }

    getOutputChannelCount(): number {
        return 1;
    }

    getPolyphony() {
        return 1;
    }

    getPins(): Pin[] {
        return [
            {
                type: "note",
                name: "Note",
            },
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Open303(context, this);
    }
}

export class Open303 extends Instrument {

    open303Node: AudioWorkletNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.open303Node = new AudioWorkletNode(context, "open303");

        this.outputNode = this.open303Node;
    }

    sendMidi(time: any, command: any, value: any, data: any) {
        this.open303Node.port.postMessage({type:"midi", time, command, value, data});
    }
}
