import { Player } from "../Player";
import { describeUnit, Instrument, InstrumentFactory, VirtualParameter, WebAudioParameter } from "./InstrumentFactory";

const oscTypeTable: OscillatorType[] = [ "sine", "square", "sawtooth", "triangle" ];

function noteToFreq(note: number) {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
}

export class KickDrumFactory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/KickDrum";
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new KickDrum(context, this);
    }
}

export class KickDrum extends Instrument {
    context: AudioContext;
    noiseBuffer: AudioBuffer;
    oscNode: OscillatorNode;
    waveShaper: WaveShaperNode;
    noiseFilter: BiquadFilterNode;
    gainNode: GainNode;
    clickGain: GainNode;
    outputGain: GainNode;

    pitch: number = 3;
    pitchDuration: number = 0.05;
    decay: number = 0.3;
    clickIntensity: number = 0.5;
    level: number = 0.8;

    constructor(context: AudioContext, factory: InstrumentFactory) {
        super(factory);

        this.context = context;

        this.oscNode = context.createOscillator();
        this.oscNode.type = "triangle";

        this.waveShaper = context.createWaveShaper();
        this.waveShaper.curve = generateWaveShaperCurve(256, 0.1);
        this.oscNode.connect(this.waveShaper);

        this.gainNode = context.createGain();
        this.gainNode.gain.value = 0;
        this.waveShaper.connect(this.gainNode);

        // Click noise generator
        this.noiseBuffer = generateNoiseBuffer(context);

        this.noiseFilter = context.createBiquadFilter();
        this.noiseFilter.type = "lowpass";
        this.noiseFilter.frequency.value = 4000;

        this.clickGain = context.createGain();
        this.noiseFilter.connect(this.clickGain);

        // Assign output node
        this.outputNode = this.outputGain = context.createGain();
        this.gainNode.connect(this.outputNode);
        this.clickGain.connect(this.outputNode);

        this.oscNode.start(0);

        this.parameters = [
            new VirtualParameter("Pitch", 1, 4, 1, "linear", (time, value) => {
                this.pitch = value;
            }),
            new VirtualParameter("Duration", 0, 0.25, 0.1, "linear", (time, value) => {
                this.pitchDuration = value;
            }),
            new VirtualParameter("Decay", 0, 1, 0.5, "linear", (time, value) => {
                this.decay = value;
            }),
            new VirtualParameter("Click", 0, 0.5, 0.25, "linear", (time, value) => {
                this.clickIntensity = value;
            }),
            new WebAudioParameter("Level", this.outputGain.gain, "linear", describeUnit("%", 100), 0, 1, 1),
            new VirtualParameter("Buzz", 0, 1, 0.5, "linear", (time, value) => {
                this.waveShaper.curve = generateWaveShaperCurve(1024, value);
            }),
            new VirtualParameter("Waveform", 0, oscTypeTable.length - 1, 0, "linear", (time, value) => {
                // description: "sine, square, sawtooth, triangle",
                this.oscNode.type = oscTypeTable[Math.round(value)];
            }),
        ];
    }

    processMidi(time: number, command: number, value: number, data: number): void {
        if (command === 0x90) {
            if (data !== 0) {
                // Note on
                // console.log("note on", time, value, data, this.pitchDuration)
                this.oscNode.frequency.cancelAndHoldAtTime(time);
                this.gainNode.gain.cancelAndHoldAtTime(time);

                const freq = noteToFreq(value);
                this.oscNode.frequency.setValueAtTime(freq * 0.5 * this.pitch, time);
                this.oscNode.frequency.exponentialRampToValueAtTime(freq * 0.5, time + this.pitchDuration);

                this.gainNode.gain.setValueAtTime(0, time);
                this.gainNode.gain.linearRampToValueAtTime(1, time + 0.005);
                this.gainNode.gain.exponentialRampToValueAtTime(0.01, time + this.decay);
                this.gainNode.gain.setValueAtTime(0, time + this.decay + 0.001);

                this.clickGain.gain.setValueAtTime(0, time);
                this.clickGain.gain.linearRampToValueAtTime(this.clickIntensity, time + 0.005);
                this.clickGain.gain.linearRampToValueAtTime(0, time + 0.05);

                const noiseNode = new AudioBufferSourceNode(this.context, {
                    buffer: this.noiseBuffer
                });

                noiseNode.addEventListener("ended", () => {
                    noiseNode.disconnect(this.noiseFilter);
                });

                noiseNode.connect(this.noiseFilter);
                noiseNode.start(time);
            }
        }
    }
}

function generateNoiseBuffer(context: AudioContext): AudioBuffer {
    const bufferSize = context.sampleRate * 0.02;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.5;
    }
    return buffer;
}

function generateWaveShaperCurve(samples: number, steepness: number): Float32Array {
    // steepness 0..1 interpolates a triangle to square
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
