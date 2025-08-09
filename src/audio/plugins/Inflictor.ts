import { SynthNote } from "../inflictor/SynthNote";
import { Player } from "../Player";
import { describeTable, describeUnit, Instrument, InstrumentFactory, VirtualParameter } from "./InstrumentFactory";

const oscTypeTable: OscillatorType[] = [ "sine", "square", "sawtooth", "triangle" ];
const biquadFilterTypeTable: BiquadFilterType[] = [ "lowpass", "highpass" ]

export class InflictorFactory extends InstrumentFactory {
    maxPolyphony = 16;

    get identifier(): string {
        return "@modulyzer/Inflictor";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new Inflictor(context, this);
    }
}

export class Inflictor extends Instrument {
    context: AudioContext;
    voicePool: SynthNote[];
    notes: Map<number, SynthNote>;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);
        this.context = context;
        this.factory = factory;
        this.notes = new Map();
        this.voicePool = Array.from({ length: factory.maxPolyphony }, () => new SynthNote(context));

        this.outputNode = this.context.createGain();
        this.voicePool.forEach((voice) => voice.ampGain.connect(this.outputNode));

        // each voice have filter etc, change all at once
        this.parameters = [
            new VirtualParameter("Osc1-Waveform", 0, 3, 2, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc1.oscillator.type = oscTypeTable[Math.round(value)]);
            }, describeTable(oscTypeTable)),
            new VirtualParameter("Osc1-Gain", 0, 1, 0.5, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc1.gainNode.gain.setValueAtTime(value, time));
            }),
            new VirtualParameter("Osc1-Detune", 0, 100, 0, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc1.oscillator.detune.setValueAtTime(value, time));
            }),
            new VirtualParameter("Osc1-LfoFreq", 0, 20, 0.2, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc1.lfo.frequency.setValueAtTime(value, time));
            }),
            new VirtualParameter("Osc1-LfoDepth", 0, 20, 10, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc1.lfoGain.gain.setValueAtTime(value, time));
            }),

            new VirtualParameter("Osc2-Waveform", 0, 3, 1, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc2.oscillator.type = oscTypeTable[Math.round(value)]);
            }, describeTable(oscTypeTable)),
            new VirtualParameter("Osc2-Gain", 0, 1, 0.5, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc2.gainNode.gain.setValueAtTime(value, time));
            }),
            new VirtualParameter("Osc2-Detune", 0, 100, 5, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc2.oscillator.detune.setValueAtTime(value, time));
            }),
            new VirtualParameter("Osc2-LfoFreq", 0, 20, 0.3, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc2.lfo.frequency.setValueAtTime(value, time));
            }),
            new VirtualParameter("Osc2-LfoDepth", 0, 20, 10, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.osc2.lfoGain.gain.setValueAtTime(value, time));
            }),

            new VirtualParameter("Filter", 0, biquadFilterTypeTable.length - 1, 0, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.filter.filter.type = biquadFilterTypeTable[Math.round(value)]);
            }, describeTable(biquadFilterTypeTable)),
            new VirtualParameter("Cutoff", 100, 10000, 2000, "exponential", (time, value) => {
                this.voicePool.forEach((voice) => voice.filter.filter.frequency.setValueAtTime(value, time));
            }),
            new VirtualParameter("Resonance", 0.001, 20, 1, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.filter.filter.Q.setValueAtTime(value, time));
            }),
            new VirtualParameter("LfoFreq", 0, 20, 0.1, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.filter.lfo.frequency.setValueAtTime(value, time));
            }),
            new VirtualParameter("LfoDepth", 0, 1000, 50, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.filter.lfoGain.gain.setValueAtTime(value, time));
            }),

            // ADSR - values used on next note trigger
            new VirtualParameter("Attack", 0, 2, 0.3, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.ampEnvelope.attack = value);
            }, describeUnit("s")),
            new VirtualParameter("Decay", 0, 2, 0.2, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.ampEnvelope.decay = value);
            }, describeUnit("s")),
            new VirtualParameter("Sustain", 0, 1, 0.7, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.ampEnvelope.sustain = value);
            }, describeUnit("%", 100)),
            new VirtualParameter("Release", 0, 2, 0.1, "linear", (time, value) => {
                this.voicePool.forEach((voice) => voice.ampEnvelope.release = value);
            }, describeUnit("s")),
        ];
    }

    private allocateVoice(note: number): SynthNote | null {
        if (this.notes.has(note)) {
            return this.notes.get(note);
        }

        const idleVoice = this.voicePool.find((voice) => !voice.isPlaying);
        if (idleVoice) {
            this.notes.set(note, idleVoice);
            return idleVoice;
        }

        // TODO: steal
        return null;
    }

    private deallocateVoice(time: number, note: number): void {
        if (this.notes.has(note)) {
            const voice = this.notes.get(note);
            voice.releaseNote(time);
            this.notes.delete(note);
        }
    }

    processMidi(time: number, command: number, value: number, data: number): void {
        if (command === 0x90) {
            if (data !== 0) {
                const voice = this.allocateVoice(value);
                if (voice) {
                    voice.triggerNote(time, value, data);
                } else {
                    console.warn("No available voices!");
                }
            } else {
                this.deallocateVoice(time, value);
            }
        } else if (command === 0x80) {
            this.deallocateVoice(time, value);
        } else if (command === 0xB0) {
            switch (value) {
                case 123: // All Notes Off
                    this.voicePool.forEach((voice) => voice.releaseNote(time));
                    this.notes.clear();
                    break;
                default:
                    console.log("Unhandled control change: ", value);
            }
        }
    }
}
