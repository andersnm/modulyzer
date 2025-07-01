import { Player, Wave } from "../Player";

export interface CcChangeDetail {
    instrument: Instrument;
    value: number;
    data: number;
}

export interface Pin {
    type: "controller" | "note";
    name: string;

    /** Combination of PIN_FLAG_xx constants */
    flags?: number; // 
    description?: string;
    value?: number;
    default?: number;
}

export type ParameterCurveType = "linear" | "exponential";
export type DescriberType = (value: number) => string;

/** Returns a `DescriberType` formatter function to describe a `Parameter` value with optional suffix and multiplier. */
export function describeUnit(suffix: string = "", multiplier: number = 1) {
    return (value: number) => (value * multiplier).toFixed(2) + suffix;
}

export abstract class Parameter {
    abstract get name(): string;
    abstract get minValue(): number;
    abstract get maxValue(): number;
    abstract get defaultValue(): number;
    ccCurve: ParameterCurveType = "linear";
    protected describer: DescriberType = describeUnit();

    abstract setValue(time: number, value: number): void;
    abstract getValue(): number;

    convertValueToMidi(value: number) {
        return (value - this.minValue) / (this.maxValue - this.minValue) * 127;
    }

    convertMidiToValue(value: number) {
        return (value / 127) * (this.maxValue - this.minValue) + this.minValue;
    }

    describeValue(value: number) {
        return this.describer(value);
    }
}

export class WebAudioParameter extends Parameter {
    name: string;
    minValue: number;
    maxValue: number;
    audioParam: AudioParam;

    constructor(name: string, audioParam: AudioParam, ccCurve: ParameterCurveType, describer?: DescriberType, minValue?: number, maxValue?: number) {
        super();
        this.name = name;
        this.audioParam = audioParam;
        this.ccCurve = ccCurve;
        this.describer = describer || this.describer;
        this.minValue = minValue !== undefined ? minValue : audioParam.minValue;
        this.maxValue = maxValue !== undefined ? maxValue : audioParam.maxValue;
    }

    get defaultValue() {
        return this.audioParam.defaultValue;
    }

    setValue(time: any, value: any) {
        this.audioParam.setValueAtTime(value, time);
    }

    getValue(): number {
        return this.audioParam.value;
    }
}

export class VirtualParameter extends Parameter {
    name: string;
    minValue: number;
    maxValue: number;
    defaultValue: number;
    setter: (time, value: number) => void;
    value: number;

    constructor(name: string, minValue: number, maxValue: number, defaultValue: number, ccCurve: ParameterCurveType, setter: (time, value: number) => void) {
        super();
        this.name = name;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.defaultValue = defaultValue;
        this.ccCurve = ccCurve;
        this.setter = setter;
        this.value = defaultValue;
    }

    setValue(time: number, value: number) {
        this.value = value;
        this.setter(time, value);
    }

    getValue(): number {
        return this.value;
    }
}

export abstract class Instrument extends EventTarget {
    factory: InstrumentFactory;
    inputNode: AudioNode | null;
    outputNode: AudioNode | null;
    pinCcs: Set<number> = new Set();
    waves: Wave[] = [];
    parameters: Parameter[];

    constructor(factory: InstrumentFactory) {
        super();

        this.factory = factory;
        this.inputNode = null;
        this.outputNode = null;

        const pins = this.factory.getPins();

        for (let i = 0; i < pins.length; i++) {
            const pin = pins[i];
            if (pin.type === "controller") {
                this.pinCcs.add(pin.value);
            }
        }

    }

    sendMidi(time: number, command: number, value: number, data: number): void {
        if (command === 0xB0) {
            if (this.pinCcs.has(value)) {
                this.dispatchEvent(new CustomEvent<CcChangeDetail>("ccchange", { detail: { instrument: this, value, data } }))
            }
        }

        this.processMidi(time, command, value, data);
    }

    sendSysex(bytes: Uint8Array) {
        this.processSysex(bytes);
    }

    protected abstract processMidi(time: number, command: number, value: number, data: number): void;
    protected processSysex(bytes: Uint8Array): void {}

    connect(destination: Instrument) {
        this.outputNode.connect(destination.inputNode);
    }

    disconnect(destination: Instrument) {
        this.outputNode.disconnect(destination.inputNode);
    }
}

export abstract class InstrumentFactory {
    useWaveTable: boolean = false;
    useSysex: boolean = false;
    abstract getIdentifier(): string;
    abstract getInputChannelCount(): number;
    abstract getOutputChannelCount(): number;
    abstract getPins(): Pin[];
    abstract createInstrument(context: AudioContext, player: Player): Instrument;

    describeCcValue(cc: number, value: number) {
        return value.toString();
    }
}
