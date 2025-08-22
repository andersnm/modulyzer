import { Player, Wave } from "../Player";
import { Instrument, InstrumentFactory } from "./InstrumentFactory";

export class WaveTrackerFactory extends InstrumentFactory {
    maxPolyphony: number = 8;
    useWaveTable = true;

    get identifier(): string {
        return "@modulyzer/WaveTracker";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new WaveTracker(context, this, player);
    }
}

interface WaveNode {
    wave: Wave;
    node: AudioBufferSourceNode;
    gain: GainNode;
    active: boolean;
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

        this.parameters = [];
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
            switch (value) {
                case 0x7B:
                    this.allNotesOff(time);
                    break;
            }
        }
    }

    noteOn(note: number, velocity: number, time: number) {
        const wave = this.getWaveByNote(note);
        if (!wave) {
            return;
        }

        // stop if already playing
        this.noteOff(note, time);

        const node = this.context.createBufferSource();
        node.buffer = wave.audioBuffer;

        const rangeInDecibels = 40;
        const waveGain = this.context.createGain();
        const dB = (velocity / 127) * rangeInDecibels - rangeInDecibels;
        const gainValue = Math.pow(10, dB / 20);
        waveGain.gain.setValueAtTime(gainValue, 0);

        const waveNode = {wave, node, gain: waveGain, active: true};
        this.nodes.push(waveNode); // there may be two same notes here, but will sort out after the "ended" event

        node.addEventListener("ended", () => {
            node.disconnect(waveGain);
            waveGain.disconnect(this.gainNode);
            const i = this.nodes.indexOf(waveNode)
            this.nodes.splice(i, 1);
        });

        node.connect(waveGain);
        waveGain.connect(this.gainNode);

        node.start(time);
    }

    noteOff(note: number, time: number) {
        for (let i = 0; i < this.nodes.length; i++) {
            const n = this.nodes[i];
            if (n.wave.note === note && n.active) {
                n.gain.gain.setTargetAtTime(0, time, 0.01);
                n.node.stop(time + 0.1);
                n.active = false;
                break;
            }
        }
    }

    allNotesOff(time: number) {
        for (let i = 0; i < this.nodes.length; i++) {
            const n = this.nodes[i];
            if (n.active) {
                n.active = false;
                n.node.stop(time);
            }
        }
    }
}
