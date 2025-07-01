import { parameterDescriptors } from "../dx7/Dx7Parameters";
import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin, WebAudioParameter } from "./InstrumentFactory";

export class Dx7Factory extends InstrumentFactory {
    useSysex = true;

    getIdentifier(): string {
        return "@modulyzer/Dx7";
    }

    getInputChannelCount(): number {
        return 1;
    }

    getOutputChannelCount(): number {
        return 1;
    }

    getPolyphony() {
        return 16;
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
        return new Dx7(context, this);
    }
}

export class Dx7 extends Instrument {

    dx7Node: AudioWorkletNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.dx7Node = new AudioWorkletNode(context, "dx7");

        this.outputNode = this.dx7Node;

        this.parameters = [];

        // Enumerate parameters in well-known midi CC order
        for (let parameterDescriptor of parameterDescriptors) {
            const parameter = this.dx7Node.parameters.get(parameterDescriptor.name);
            this.parameters.push(new WebAudioParameter(parameterDescriptor.name, parameter, "linear"));
        }
    }

    processMidi(time: any, command: any, value: any, data: any) {
        this.dx7Node.port.postMessage({type:"midi", time, command, value, data});
    }

    processSysex(bytes: Uint8Array) {
        const clone = new Uint8Array(bytes);
        this.dx7Node.port.postMessage({type:"sysex", bytes});
    }
}
