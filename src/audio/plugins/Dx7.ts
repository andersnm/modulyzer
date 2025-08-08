import { parameterDescriptors } from "../dx7/Dx7Parameters";
import { Player } from "../Player";
import { Instrument, InstrumentFactory, WebAudioParameter } from "./InstrumentFactory";

export class Dx7Factory extends InstrumentFactory {
    maxPolyphony: number = 8;

    get identifier(): string {
        return "@modulyzer/Dx7";
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
            this.parameters.push(new WebAudioParameter(parameterDescriptor.name, parameter, parameterDescriptor.curve ?? "linear", parameterDescriptor.describer));
        }
    }

    processMidi(time: any, command: any, value: any, data: any) {
        this.dx7Node.port.postMessage({type:"midi", time, command, value, data});
    }
}
