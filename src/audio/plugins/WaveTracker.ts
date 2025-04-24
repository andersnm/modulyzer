import { Player, Wave } from "../Player";
import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

export class WaveTrackerFactory extends InstrumentFactory {
    useWaveTable = true;

    getIdentifier(): string {
        return "@modulyzer/WaveTracker";
    }

    getInputChannelCount(): number {
        return 0;
    }

    getOutputChannelCount(): number {
        return 2;
    }

    getPins(): Pin[] {
        return [
            {
                type: "note",
                name: "Wave",
                description: "Notes are mapped in the wave table.",
                value: 0,
            },
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new WaveTracker(context, this, player);
    }
}

interface WaveNode {
    wave: Wave;
    node: AudioBufferSourceNode;
}

export class WaveTracker extends Instrument {
    context: AudioContext;
    player: Player;
    gainNode: GainNode;
    nodes: WaveNode[] = []; // TODO; note+node

    constructor(context: AudioContext, factory: InstrumentFactory, player: Player) {
        super(factory);

        this.context = context;
        this.player = player;
        this.gainNode = new GainNode(context, {});

        this.outputNode = this.gainNode;
    }

    getWaveByNote(note: number) {
        for (let wave of this.waves) {
            if (wave.note === note) {
                return wave;
            }
        }

        return null;
    }

    processMidi(time: any, command: any, value: any, data: any) {
        if (command === 0x90) {
            if (data !== 0) {
                this.noteOn(value, data, time);
            } else {
                this.noteOff(value, time);
            }
        } else if (command === 0xB0) {
            // controller #1;
        }
    }

    noteOn(note, velocity, time) {
        const wave = this.getWaveByNote(note);
        if (!wave) {
            return;
        }

        // stop if already playing
        this.noteOff(note, time);

        const node = this.context.createBufferSource();
        node.buffer = wave.audioBuffer;

        const waveNode = {wave, node};
        this.nodes.push(waveNode); // there may be two same notes here, but will sort out after the "ended" event

        node.addEventListener("ended", () => {
            console.log("end of playback");
            node.disconnect(this.gainNode);
            const i = this.nodes.indexOf(waveNode)
            this.nodes.splice(i, 1);
        });

        node.connect(this.gainNode);

        node.start(time);
    }

    noteOff(note, time) {
        for (let i = 0; i < this.nodes.length; ) {
            const n = this.nodes[i];
            if (n.wave.note === note) {
                console.log("Note stopped", n.wave)
                n.node.stop(time);
                this.nodes.splice(i, 1);
                break;
            }

            i++;
        }
    }
}
