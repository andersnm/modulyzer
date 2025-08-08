import { Player } from "../Player";
import { describeTable, Instrument, InstrumentFactory, VirtualParameter } from "./InstrumentFactory";

function noteToFreq(note) {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
}

const oscTypeTable: OscillatorType[] = [ "sine", "square", "sawtooth", "triangle" ];

function getOscType(value: number) {
    const index = (value / 127) * (oscTypeTable.length - 1);
    return oscTypeTable[Math.floor(index)];
}

export class OscillatorFactory extends InstrumentFactory {
    maxPolyphony: number = 1;

    get identifier(): string {
        return "@modulyzer/Oscillator";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Oscillator(context, this);
    }
}

export class Oscillator extends Instrument {

    oscNode: OscillatorNode;
    gainNode: GainNode;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.oscNode = new OscillatorNode(context, {});
        this.gainNode = new GainNode(context, {});

        this.gainNode.gain.setValueAtTime(0, 0)

        this.oscNode.connect(this.gainNode);

        this.oscNode.start(0);

        this.outputNode = this.gainNode;

        this.parameters = [
            new VirtualParameter("Waveform", 0, oscTypeTable.length - 1, 0, "linear", (time, value) => {
                // description: "sine, square, sawtooth, triangle",
                this.oscNode.type = oscTypeTable[Math.round(value)];
            }, describeTable(oscTypeTable)),
        ];

    }

    processMidi(time: number, command: number, value: number, data: number): void {
        if (command === 0x90) {
            if (data !== 0) {
                // note on
                const freq = noteToFreq(value);
                console.log("osc note on, ", value, freq, time)
                this.oscNode.frequency.setValueAtTime(freq, time);
                this.gainNode.gain.setTargetAtTime(1, time, 0.02)
            } else {
                // note off
                console.log("osc note off, ", time)
                this.gainNode.gain.setTargetAtTime(0, time, 0.02)
            }
        }
    }
}
