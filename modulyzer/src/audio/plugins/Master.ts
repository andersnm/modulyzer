import { Player } from "../Player";
import { Instrument, InstrumentFactory } from "./InstrumentFactory";

export class MasterFactory extends InstrumentFactory {
    get identifier(): string {
        return "@modulyzer/Master";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Master(this, player);
    }
}

export class Master extends Instrument {
    player: Player;

    constructor(factory: InstrumentFactory, player: Player) {
        super(factory);
        this.outputNode = null;
        this.inputNode = player.device.masterGainNode;
        this.parameters = [];
    }

    processMidi(time: any, command: any, value: any, data: any) {
    }
}
