import { expToLin, linToExp, linToLin } from "../open303/Functions";
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
            {
                type: "controller",
                name: "Cutoff",
                value: 74,
                default: expToLin(500, 314.0,  2394.0, 0.0, 127.0)
            },
            {
                type: "controller",
                name: "Resonance",
                value: 71,
                default: 64
            },
            {
                type: "controller",
                name: "EnvMod",
                value: 81,
                default: 64
            },
            // {
            //     type: "controller",
            //     name: "Decay",
            //     value: 81,
            //     default: 400,
            // },
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Open303(context, this);
    }

    describeCcValue(pinIndex: number, value: number): string {
        switch (pinIndex) {
            case 74: // cutoff
                return linToExp(value, 0.0, 127.0, 314.0,  2394.0).toFixed(0) + "hz";
            case 71: // reso
            case 81: // env mod
                return linToLin(value, 0.0, 127.0, 0.0, 100.0).toFixed(0) + "%";
        }

        return super.describeCcValue(pinIndex, value);
    }
}

export class Open303 extends Instrument {

    open303Node: AudioWorkletNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.open303Node = new AudioWorkletNode(context, "open303");

        this.outputNode = this.open303Node;
    }

    processMidi(time: number, command: number, value: number, data: number) {
        this.open303Node.port.postMessage({type:"midi", time, command, value, data});
    }
}
