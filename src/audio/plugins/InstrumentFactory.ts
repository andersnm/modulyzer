import { Player, Wave } from "../Player";

export type ParameterCurveType = "linear" | "exponential";
export type DescriberType = (value: number) => string;

/** Returns a `DescriberType` formatter function to describe a `Parameter` value with optional suffix and multiplier. */
export function describeUnit(suffix: string = "", multiplier: number = 1) {
    return (value: number) => (value * multiplier).toFixed(2) + suffix;
}

export function describeTable(table: string[]) {
    return (value: number) => table[Math.round(value)];
}

export interface AudioParamDescriptorEx extends AudioParamDescriptor {
    describer?: DescriberType;
    curve?: ParameterCurveType;
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
        if (this.ccCurve === "exponential") {
            return Math.log(value / this.minValue) / Math.log(this.maxValue / this.minValue) * 127 + 0;
        } else {
            return (value - this.minValue) / (this.maxValue - this.minValue) * 127;
        }
    }

    convertMidiToValue(value: number) {
        if (this.ccCurve === "exponential") {
            return this.minValue * Math.exp(value / 127 * Math.log(this.maxValue / this.minValue));
        } else {
            return (value / 127) * (this.maxValue - this.minValue) + this.minValue;
        }
    }

    describeValue(value: number) {
        return this.describer(value);
    }
}

export class WebAudioParameter extends Parameter {
    name: string;
    minValue: number;
    maxValue: number;
    defaultValue: number;
    audioParam: AudioParam;

    constructor(name: string, audioParam: AudioParam, ccCurve: ParameterCurveType, describer?: DescriberType, minValue?: number, maxValue?: number, defaultValue?: number) {
        super();
        this.name = name;
        this.audioParam = audioParam;
        this.ccCurve = ccCurve;
        this.describer = describer || this.describer;
        this.minValue = minValue !== undefined ? minValue : audioParam.minValue;
        this.maxValue = maxValue !== undefined ? maxValue : audioParam.maxValue;
        this.defaultValue = defaultValue !== undefined ? defaultValue : audioParam.defaultValue;
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

    constructor(name: string, minValue: number, maxValue: number, defaultValue: number, ccCurve: ParameterCurveType, setter: (time, value: number) => void, describer?: DescriberType) {
        super();
        this.name = name;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.defaultValue = defaultValue;
        this.ccCurve = ccCurve;
        this.setter = setter;
        if (describer) {
            this.describer = describer;
        }
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
    waves: Wave[] = [];
    parameters: Parameter[];

    constructor(factory: InstrumentFactory) {
        super();

        this.factory = factory;
        this.inputNode = null;
        this.outputNode = null;
    }

    sendMidi(time: number, command: number, value: number, data: number): void {
        this.processMidi(time, command, value, data);
    }

    protected abstract processMidi(time: number, command: number, value: number, data: number): void;

    connect(destination: AudioNode) {
        this.outputNode.connect(destination);
    }

    disconnect(destination: AudioNode) {
        this.outputNode.disconnect(destination);
    }
}

export abstract class InstrumentFactory {
    useWaveTable: boolean = false;
    maxPolyphony: number = 0;
    abstract get identifier(): string;
    abstract createInstrument(context: AudioContext, player: Player): Instrument;
}
