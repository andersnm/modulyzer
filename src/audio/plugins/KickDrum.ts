import { linToLin } from "../open303/Functions";
import { Player } from "../Player";
import { Instrument, InstrumentFactory, Pin } from "./InstrumentFactory";

const oscTypeTable: OscillatorType[] = [ "sine", "square", "sawtooth", "triangle" ];

function noteToFreq(note: number) {
    let a = 440; //frequency of A (coomon value is 440Hz)
    return (a / 32) * (2 ** ((note - 9) / 12));
}

export class KickDrumFactory extends InstrumentFactory {
    getIdentifier(): string {
        return "@modulyzer/KickDrum";
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
                name: "Note"
            },
            {
                type: "controller",
                name: "Wave",
                description: "sine, square, sawtooth, triangle",
                value: 6,
                default: 0
            },
            {
                type: "controller",
                name: "Pitch",
                description: "Pitch",
                value: 0,
                default: 64
            },
            {
                type: "controller",
                name: "Pitch Duration",
                description: "Pitch Duration",
                value: 4,
                default: 64
            },
            {
                type: "controller",
                name: "Buzz",
                description: "Shape the wave by amount",
                value: 5,
                default: 16
            },
            {
                type: "controller",
                name: "Decay",
                description: "Controls fade-out duration",
                value: 1,
                default: 64
            },
            {
                type: "controller",
                name: "Click",
                description: "Controls transient click",
                value: 2,
                default: 64
            },
            {
                type: "controller",
                name: "Level",
                description: "Output gain",
                value: 3,
                default: 127
            },
        ];
    }

    createInstrument(context: AudioContext, player: Player): Instrument {
        return new KickDrum(context, this);
    }

    describeCcValue(pinIndex: number, value: number): string {
        switch (pinIndex) {
            case 6: // type
                return oscTypeTable[Math.round(value / 127 * (oscTypeTable.length - 1))];
            case 1: // decay
                return (value / 127).toFixed(3) + "s";
            case 4: // pitch duration
                return (value / 127 / 4).toFixed(3) + "s";
            case 5: // buzz
                return linToLin(value, 0.0, 127.0, 0.0, 100.0).toFixed(0) + "%";
            case 2: // click
                return linToLin(value, 0.0, 127.0, 0.0, 100.0).toFixed(0) + "%";
            case 3: // level
                return linToLin(value, 0.0, 127.0, 0.0, 100.0).toFixed(0) + "%";
        }

        return super.describeCcValue(pinIndex, value);
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
        } else if (command === 0xB0) {
            switch (value) {
                case 0: // pitch
                    this.pitch = ((data / 127) * 3) + 1; // scale by 1..4 octaves
                    break;
                case 4: // pitch duration
                    this.pitchDuration = (data / 127) / 4; // 0..0.25 sec
                    break;
                case 1: // Decay
                    this.decay = (data / 127) * 1; // up to 1 second decay
                    break;
                case 2: // Click
                    this.clickIntensity = (data / 127) * 0.5;
                    break;
                case 3: // Level
                    this.level = data / 127;
                    this.outputGain.gain.setValueAtTime(this.level, time);
                    break;
                case 5: // Buzz
                    this.waveShaper.curve = generateWaveShaperCurve(1024, data / 127);
                    break;
                case 6:
                    this.oscNode.type = oscTypeTable[Math.round(data / 127 * (oscTypeTable.length - 1))];
                    break;
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
