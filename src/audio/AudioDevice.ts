import recorderWorkletUrl from "./RecorderWorklet.js?worker&url";
import dx7WorkletUrl from "./dx7/Dx7Worklet.js?worker&url";
import open303WorkletUrl from "./open303/Open303Worklet.js?worker&url";

import { Recorder } from "./Recorder.js";

export class AudioDevice {

    latencySec: number = 0.125;
    inputDeviceId: string = null;
    outputDeviceId: string = null;
    context: AudioContext | null = null;
    inputNode: MediaStreamAudioSourceNode;
    recorder: Recorder;
    inputMode: "stereo" | "left" | "right";

    constructor() {
        this.inputMode = "stereo";
    }

    async create(outputDeviceId: string, inputDeviceId: string, latencySec: number) {

        if (this.context) {
            await this.context.close();
            this.context = null;
        }

        this.outputDeviceId = outputDeviceId;
        this.inputDeviceId = inputDeviceId;
        this.latencySec = latencySec;

        this.context = new AudioContext({ sinkId: outputDeviceId, latencyHint: latencySec } as any);

        await this.context.audioWorklet.addModule(recorderWorkletUrl);
        await this.context.audioWorklet.addModule(dx7WorkletUrl);
        await this.context.audioWorklet.addModule(open303WorkletUrl);

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: inputDeviceId },
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
            video: false,
        });
        this.inputNode = this.context.createMediaStreamSource(stream);

        this.recorder = new Recorder(this.context);
        this.inputNode.connect(this.recorder.recordNode);
    }

    async close() {
        this.inputNode.disconnect(this.recorder.recordNode);
        this.recorder.destroy();

        await this.context.close();
        this.context = null;
        this.inputNode = null;
    }
}
