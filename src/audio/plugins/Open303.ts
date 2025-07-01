import { expToLin, linToExp, linToLin } from "../open303/Functions";
import { parameterDescriptors } from "../open303/Open303Parameters";
import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin, WebAudioParameter } from "./InstrumentFactory";

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
            {
                type: "controller",
                name: "Decay",
                value: 101,
                default: 32, // ~400
            },
            {
                type: "controller",
                name: "Accent",
                value: 102,
                default: 0,
            },
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
            case 101: // decay
                return linToExp(value, 0.0, 127.0, 200.0, 2000.0).toFixed(1);
            case 102: // accent
                return linToLin(value, 0.0, 127.0, 0.0, 100).toFixed(0) + "%";
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

        this.parameters = [];

        // Enumerate parameters in well-known midi CC order
        // TODO: cutoff and decay to be exponential
        for (let parameterDescriptor of parameterDescriptors) {
            const parameter = this.open303Node.parameters.get(parameterDescriptor.name);
            this.parameters.push(new WebAudioParameter(parameterDescriptor.name, parameter, "linear"));
        }

    }

    processMidi(time: number, command: number, value: number, data: number) {
        this.open303Node.port.postMessage({type:"midi", time, command, value, data});
    }
}
