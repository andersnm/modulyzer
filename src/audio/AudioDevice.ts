import { Recorder } from "./Recorder.js";

export class AudioDevice {

    context: AudioContext | null;
    inputNode: MediaStreamAudioSourceNode;
    recorder: Recorder;
    inputMode: "stereo" | "left" | "right";

    constructor() {
        this.inputMode = "stereo";
    }

    async create(outputDeviceId, inputDeviceId) {

        // TODO; should destroy first

        this.context = new AudioContext({ sinkId: outputDeviceId } as any);

        const workletUrl = new URL("../../assets/RecordWorklet.js", import.meta.url);
        await this.context.audioWorklet.addModule(workletUrl);

        const dx7WorkletUrl = new URL("./dx7/Dx7Worklet.ts", import.meta.url);
        await this.context.audioWorklet.addModule(dx7WorkletUrl);

        const open303WorkletUrl = new URL("./Open303/Open303Worklet.ts", import.meta.url);
        await this.context.audioWorklet.addModule(open303WorkletUrl);

        // TODO; record differently and on-demand

        const stream = await navigator.mediaDevices.getUserMedia({audio: {advanced: [{ deviceId: inputDeviceId}]}, video: false});
        this.inputNode = this.context.createMediaStreamSource(stream);

        this.recorder = new Recorder(this.context);
        this.inputNode.connect(this.recorder.recordNode);
    }

    async close() {
        // this.recorder.close();
        this.inputNode.disconnect(this.recorder.recordNode);

        await this.context.close();
        this.context = null;
        this.inputNode = null;
    }
}
