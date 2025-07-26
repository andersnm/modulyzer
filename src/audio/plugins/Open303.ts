import { parameterDescriptors } from "../open303/Open303Parameters";
import { Player } from "../Player";
import { Instrument, InstrumentFactory, WebAudioParameter } from "./InstrumentFactory";

export class Open303Factory extends InstrumentFactory {
    maxPolyphony: number = 2;

    get identifier(): string {
        return "@modulyzer/Open303";
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
