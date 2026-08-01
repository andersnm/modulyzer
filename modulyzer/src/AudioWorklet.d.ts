// hacked together from various sources, among this:
// https://github.com/microsoft/TypeScript/issues/28308

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/currentFrame) */
declare readonly var currentFrame: number;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/currentTime) */
declare readonly var currentTime: number;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/sampleRate) */
declare readonly var sampleRate: number;
/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioWorkletGlobalScope/registerProcessor) */

interface AudioWorkletProcessor {
    readonly port: MessagePort;
}

interface AudioWorkletProcessorImpl extends AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

type AudioParamDescriptor = {
    name: string,
    automationRate: AutomationRate,
    minValue: number,
    maxValue: number,
    defaultValue: number
}

interface AudioWorkletProcessorConstructor {
    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessorImpl;
    parameterDescriptors?: AudioParamDescriptor[];
}

declare function registerProcessor(
    name: string,
    processorCtor: AudioWorkletProcessorConstructor,
): void;