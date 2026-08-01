import { AudioParamDescriptorEx, describeUnit } from "../plugins/InstrumentFactory";

export const parameterDescriptors: AudioParamDescriptorEx[] = [
    { name: "cutoff", defaultValue: 500, minValue: 314, maxValue: 2394, automationRate: "k-rate", describer: describeUnit("hz"), curve: "exponential" },
    { name: "resonance", defaultValue: 50, minValue: 0, maxValue: 100, automationRate: "k-rate" },
    { name: "envMod", defaultValue: 0.25, minValue: 0, maxValue: 100, automationRate: "k-rate" },
    { name: "waveform", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
    { name: "decay", defaultValue: 400, minValue: 200, maxValue: 2000, automationRate: "k-rate", describer: describeUnit("ms"), curve: "exponential" },
    { name: "accent", defaultValue: 100, minValue: 0, maxValue: 100, automationRate: "k-rate" },
];
