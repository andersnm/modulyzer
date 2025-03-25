import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin, PIN_FLAG_WAVE } from "./InstrumentFactory";

export class WaveTrackerFactory extends InstrumentFactory {
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
                flags: PIN_FLAG_WAVE,
                description: "Notes are mapped 1:1 to wave table indices.",
                value: 0,
            },
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        // HOW TO ACCESS WAVETABLE! -> sub to changes -> song-document -> device -> player
        // make buffernodes for waves as they are played, can overlap
        return new WaveTracker(context, this, player);
    }
}

export class WaveTracker extends Instrument {
    context: AudioContext;
    player: Player;
    // reverbNode: AudioBufferSourceNode;
    gainNode: GainNode;
    nodes: AudioBufferSourceNode[] = []; // TODO; note+node

    constructor(context: AudioContext, factory: InstrumentFactory, player: Player) {
        super(factory);

        this.context = context;
        this.player = player;
        this.gainNode = new GainNode(context, {});

        this.outputNode = this.gainNode;
    }

    getWaveByNote(note: number) {
        const waveIndex = note % 12;
        const wave = this.player.waves[waveIndex];
        if (!wave) {
            return null;
        }

        return wave;
    }

    sendMidi(time: any, command: any, value: any, data: any) {
        if (command === 0x90) {
            const wave = this.getWaveByNote(value);
            if (!wave) {
                return;
            }

            const node = this.context.createBufferSource();
            node.buffer = wave.audioBuffer;
            node.addEventListener("ended", () => {
                console.log("end of playback");

            });

            console.log("wave note on, ", value, time)
            
            node.connect(this.gainNode);

            node.start(time);
        } else if (command === 0xB0) {
            // controller #1; the type
            // this.oscNode.type = oscTypeTable[value];
        }
    }
}
