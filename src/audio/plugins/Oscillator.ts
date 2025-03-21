import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

function noteToFreq(note) {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
}

const oscTypeTable: OscillatorType[] = [ "sine", "square", "sawtooth", "triangle" ];

export class OscillatorFactory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/Oscillator";
    }

    getInputChannelCount(): number {
        return 0;
    }

    getOutputChannelCount(): number {
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
                name: "Type",
                description: "0=sine, 1=square, 2=sawtooth, 3=triangle",
                value: 0,
            },
        ];
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
    }

    sendMidi(time: number, command: number, value: number, data: number): void {
        if (command === 0x90) {
            // note on
            const freq = noteToFreq(value);
            console.log("osc note on, ", value, freq, time)
            this.oscNode.frequency.setValueAtTime(freq, time);
            this.gainNode.gain.setTargetAtTime(1, time, 0.02)
        } else if (command === 0x91) {
            // note off
            console.log("osc note off, ", time)
            this.gainNode.gain.setTargetAtTime(0, time, 0.02)
        } else if (command === 0xB0) {
            // controller #1; the type
            this.oscNode.type = oscTypeTable[value];
        }
    }
}
