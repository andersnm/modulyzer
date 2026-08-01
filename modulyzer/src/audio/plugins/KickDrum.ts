import { Player } from "../Player";
import { describeTable, describeUnit, Instrument, InstrumentFactory, VirtualParameter, WebAudioParameter } from "./InstrumentFactory";

const oscTypeTable: OscillatorType[] = [ "sine", "square", "sawtooth", "triangle" ];

function noteToFreq(note: number) {
    const a = 440;
    return (a / 32) * (2 ** ((note - 9) / 12));
}

export class KickDrumFactory extends InstrumentFactory {
    maxPolyphony: number = 1;

    get identifier(): string {
        return "@modulyzer/KickDrum";
    }

    createInstrument(context: BaseAudioContext, player: Player): Instrument {
        return new KickDrum(context, this);
    }
}

class KickVoice {
    private context: BaseAudioContext;

    private osc: OscillatorNode | null = null;
    private shaper: WaveShaperNode | null = null;
    private toneGain: GainNode;

    private noiseSrc: AudioBufferSourceNode | null = null;
    private noiseFilter: BiquadFilterNode | null = null;
    private clickGain: GainNode;

    private outGain: GainNode;

    note: number = -1;
    isActive = false;
    noteOnTime = 0;
    releaseEndTime: number | null = null;

    constructor(context: BaseAudioContext) {
        this.context = context;

        this.toneGain = context.createGain();
        this.toneGain.gain.setValueAtTime(0, 0);

        this.clickGain = context.createGain();
        this.clickGain.gain.setValueAtTime(0, 0);

        this.outGain = context.createGain();
        this.outGain.gain.setValueAtTime(1, 0);

        this.shaper = this.context.createWaveShaper();

        this.noiseFilter = this.context.createBiquadFilter();
        this.noiseFilter.type = "lowpass";
        this.noiseFilter.frequency.setValueAtTime(4000, 0);

        this.shaper.connect(this.toneGain);
        this.toneGain.connect(this.outGain);

        this.noiseFilter.connect(this.clickGain);
        this.clickGain.connect(this.outGain);
    }

    connect(dest: AudioNode) {
        this.outGain.connect(dest);
    }

    trigger(
        time: number,
        note: number,
        params: {
            pitch: number;
            pitchDuration: number;
            decay: number;
            clickIntensity: number;
            level: number;
            oscType: OscillatorType;
            shaperCurve: Float32Array;
            noiseBuffer: AudioBuffer;
        }
    ) {
        this.note = note;
        this.noteOnTime = time;
        this.isActive = true;

        const { pitch, pitchDuration, decay, clickIntensity, level, oscType, shaperCurve, noiseBuffer } = params;

        this.releaseEndTime = time + Math.max(decay, 0.1);

        // Tone osc + shaper
        this.osc = this.context.createOscillator();
        this.osc.type = oscType;

        const baseFreq = noteToFreq(note) * 0.5;
        this.osc.frequency.setValueAtTime(baseFreq * pitch, time);
        this.osc.frequency.exponentialRampToValueAtTime(baseFreq, time + pitchDuration);

        this.shaper.curve = shaperCurve as Float32Array<ArrayBuffer>;
        this.osc.connect(this.shaper);

        this.toneGain.gain.cancelScheduledValues(time);
        this.toneGain.gain.setValueAtTime(0, time);
        this.toneGain.gain.linearRampToValueAtTime(1, time + 0.005);
        this.toneGain.gain.exponentialRampToValueAtTime(0.01, time + decay);
        this.toneGain.gain.setValueAtTime(0, time + decay + 0.001);

        this.osc.start(time);
        this.osc.stop(this.releaseEndTime);

        // Click noise
        this.noiseSrc = new AudioBufferSourceNode(this.context, { buffer: noiseBuffer });
        this.noiseSrc.connect(this.noiseFilter);

        this.clickGain.gain.cancelScheduledValues(time);
        this.clickGain.gain.setValueAtTime(0, time);
        this.clickGain.gain.linearRampToValueAtTime(clickIntensity, time + 0.005);
        this.clickGain.gain.linearRampToValueAtTime(0, time + 0.05);

        this.noiseSrc.start(time);
        this.noiseSrc.stop(time + 0.06);

        // overall level
        this.outGain.gain.setValueAtTime(level, time);
    }

    isFinished(now: number) {
        return this.releaseEndTime !== null && now >= this.releaseEndTime;
    }

    clear() {
        this.isActive = false;
        this.note = -1;
        this.releaseEndTime = null;

        this.osc = null;
        this.noiseSrc = null;
    }
}

export class KickDrum extends Instrument {
    private context: BaseAudioContext;

    private voicePool: KickVoice[];

    private noiseBuffer: AudioBuffer;
    private shaperCurve: Float32Array;
    private oscType: OscillatorType = "triangle";

    pitch: number = 3;
    pitchDuration: number = 0.05;
    decay: number = 0.3;
    clickIntensity: number = 0.5;
    level: number = 0.8;

    constructor(context: BaseAudioContext, factory: InstrumentFactory) {
        super(factory);
        this.context = context;

        this.noiseBuffer = generateNoiseBuffer(context);
        this.shaperCurve = generateWaveShaperCurve(256, 0.1);

        this.voicePool = Array.from(
            { length: 4 },
            () => new KickVoice(context)
        );

        const out = context.createGain();
        out.gain.setValueAtTime(1, 0);
        this.outputNode = out;

        this.voicePool.forEach(v => v.connect(out));

        this.parameters = [
            new VirtualParameter("Pitch", 1, 4, 3, "linear", (time, value) => {
                this.pitch = value;
            }),
            new VirtualParameter("Duration", 0, 0.25, 0.05, "linear", (time, value) => {
                this.pitchDuration = value;
            }),
            new VirtualParameter("Decay", 0, 1, 0.3, "linear", (time, value) => {
                this.decay = value;
            }),
            new VirtualParameter("Click", 0, 0.5, 0.5, "linear", (time, value) => {
                this.clickIntensity = value;
            }),
            new WebAudioParameter("Level", out.gain, "linear", describeUnit("%", 100), 0, 1, 0.8),
            new VirtualParameter("Buzz", 0, 1, 0.1, "linear", (time, value) => {
                this.shaperCurve = generateWaveShaperCurve(1024, value);
            }),
            new VirtualParameter("Waveform", 0, oscTypeTable.length - 1, 2, "linear", (time, value) => {
                this.oscType = oscTypeTable[Math.round(value)];
            }, describeTable(oscTypeTable)),
        ];
    }

    private allocateVoice(now: number): KickVoice {
        for (const v of this.voicePool) {
            if (v.isActive && v.isFinished(now)) {
                v.clear();
            }
        }

        const idle = this.voicePool.find(v => !v.isActive);
        if (idle) return idle;

        const stolen = this.voicePool.reduce((a, b) =>
            a.noteOnTime < b.noteOnTime ? a : b
        );

        stolen.clear();
        return stolen;
    }

    processMidi(time: number, command: number, value: number, velocity: number): void {
        if (command === 0x90 && velocity !== 0) {
            const v = this.allocateVoice(time);
            v.trigger(time, value, {
                pitch: this.pitch,
                pitchDuration: this.pitchDuration,
                decay: this.decay,
                clickIntensity: this.clickIntensity,
                level: this.level,
                oscType: this.oscType,
                shaperCurve: this.shaperCurve,
                noiseBuffer: this.noiseBuffer,
            });
        }
    }
}

function generateNoiseBuffer(context: BaseAudioContext): AudioBuffer {
    const bufferSize = context.sampleRate * 0.02;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
    }
    return buffer;
}

function generateWaveShaperCurve(samples: number, steepness: number): Float32Array {
    const curve = new Float32Array(samples);
    const range = steepness * samples / 2;

    for (let i = 0; i < samples; i++) {
        let x = ((i - range) / (samples - 2 * range)) * 2 - 1;
        if (i < range) x = -1;
        if (i > samples - range) x = 1;
        curve[i] = x;
    }

    return curve;
}
