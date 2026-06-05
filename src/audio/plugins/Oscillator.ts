import { Player } from "../Player";
import { describeTable, Instrument, InstrumentFactory, VirtualParameter } from "./InstrumentFactory";

function noteToFreq(note) {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
}

const oscTypeTable: OscillatorType[] = [ "sine", "square", "sawtooth", "triangle" ];

class OscVoice {
    private context: AudioContext;
    private osc: OscillatorNode | null = null;
    private gain: GainNode;

    note: number = -1;
    isActive = false;
    noteOnTime = 0;
    releaseEndTime: number | null = null;

    oscType: OscillatorType = "sine";
    releaseTime = 0.02;

    constructor(context: AudioContext) {
        this.context = context;
        this.gain = new GainNode(context);
        this.gain.gain.setValueAtTime(0, 0);
    }

    connect(dest: AudioNode) {
        this.gain.connect(dest);
    }

    trigger(time: number, note: number, freq: number, oscType: OscillatorType) {
        this.note = note;
        this.noteOnTime = time;
        this.releaseEndTime = null;
        this.isActive = true;
        this.oscType = oscType;

        if (this.osc) {
            this.osc.stop(time);
            this.osc = null;
        }

        const osc = new OscillatorNode(this.context);
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(this.gain);
        osc.start(time);

        this.osc = osc;

        // simple attack
        this.gain.gain.cancelScheduledValues(time);
        this.gain.gain.setValueAtTime(this.gain.gain.value, time);
        this.gain.gain.setTargetAtTime(1, time, 0.01);
    }

    release(time: number) {
        if (!this.isActive) return;

        this.releaseEndTime = time + this.releaseTime;

        this.gain.gain.cancelScheduledValues(time);
        this.gain.gain.setValueAtTime(this.gain.gain.value, time);
        this.gain.gain.setTargetAtTime(0, time, this.releaseTime);

        if (this.osc) {
            this.osc.stop(this.releaseEndTime);
        }
    }

    isFinished(now: number) {
        return this.releaseEndTime !== null && now >= this.releaseEndTime;
    }

    clear() {
        this.isActive = false;
        this.note = -1;
        this.osc = null;
    }
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
    private context: AudioContext;
    private voicePool: OscVoice[];

    private oscType: OscillatorType = "sine";

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);
        this.context = context;

        this.voicePool = Array.from(
            { length: 4 },
            () => new OscVoice(context)
        );

        this.outputNode = new GainNode(context);

        this.voicePool.forEach(v => v.connect(this.outputNode));

        this.parameters = [
            new VirtualParameter(
                "Waveform",
                0,
                oscTypeTable.length - 1,
                0,
                "linear",
                (time, value) => {
                    this.oscType = oscTypeTable[Math.round(value)];
                },
                describeTable(oscTypeTable)
            ),
        ];
    }

    private allocateVoice(note: number): OscVoice {
        const now = this.context.currentTime;

        for (const v of this.voicePool) {
            if (v.isActive && v.isFinished(now)) {
                v.clear();
            }
        }

        const existing = this.voicePool.find(v => v.note === note && v.isActive);
        if (existing) return existing;

        const idle = this.voicePool.find(v => !v.isActive);
        if (idle) return idle;

        // steal
        return this.voicePool.reduce((a, b) =>
            a.noteOnTime < b.noteOnTime ? a : b
        );
    }

    private releaseVoice(time: number, note: number) {
        const v = this.voicePool.find(v => v.note === note && v.isActive);
        if (v) v.release(time);
    }

    processMidi(time: number, command: number, value: number, velocity: number): void {
        if (command === 0x90) {
            if (velocity !== 0) {
                const freq = noteToFreq(value);
                const v = this.allocateVoice(value);
                v.trigger(time, value, freq, this.oscType);
            } else {
                this.releaseVoice(time, value);
            }
        } else if (command === 0x80) {
            this.releaseVoice(time, value);
        }
    }
}
