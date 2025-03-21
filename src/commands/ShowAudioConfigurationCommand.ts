import { Appl } from "../App";
import { AudioDevice } from "../audio/AudioDevice";
import { tryGetMicrophonePermission } from "../audio/AudioUtil";
import { AudioConfiguration } from "../components/AudioConfiguration";
import { IComponent, INotify } from "../nutz";

export class ShowAudioConfigurationCommand implements INotify {
    constructor(private app: Appl) {
    }

    // async onConfirmDevice(detail: AudioConfigurationConfirm) {
    //     console.log("DEVICE CONFIRM", detail)

    //     await this.app.device.create(detail.outputDeviceId, detail.inputDeviceId);

    //     // this.context = new AudioContext({sinkId: e.detail.outputDeviceId} as any);
    //     // const workletUrl = new URL("../assets/RecordWorklet.js", import.meta.url);
    //     // console.log("WORKLET URL", workletUrl);
    //     // await this.context.audioWorklet.addModule(workletUrl);

    //     // const stream = await navigator.mediaDevices.getUserMedia({audio: {advanced: [{ deviceId: e.detail.inputDeviceId}]}, video: false});
    //     // this.inputNode = this.context.createMediaStreamSource(stream);
    //     // connect it when recording

    //     console.log("DEVICE CONFIRMED")

    //     this.app.props.currentInputDeviceId = detail.inputDeviceId;
    //     this.app.props.currentOutputDeviceId = detail.outputDeviceId;
    //     this.app.props.inputMode = detail.inputMode;
    //     // this.app.props.showAudioConfiguration = false;
    // }

    // async onDeviceChange() {
    //     console.log("DEVICE CHANGE")

    //     // if granted, selected and active, do not show modal
    //     // but should trigger the modal if prompt or denied
    //     // close and reset audiocontext if device no longer exist?

    //     this.app.props.microphonePermission = await this.app.getMicrophonePermission();

    //     // denied - show instructions how to enable user must manually reconfigure chrome to allow
    //     // prompt - request permission, continue
    //     // granted - continue?

    //     // Must have granted permission before calling enumerateDevices() to access to all devices and details

    //     if (this.app.props.microphonePermission === "prompt") {
    //         try {
    //             // Request permission to an arbitrary audio device. This lets query for more details. Don't care about the returned device for now
    //             await navigator.mediaDevices.getUserMedia({audio: true, video: false});
    //         } catch (err) {
    //             if (err.message === "Permission dismissed") {
    //                 this.app.props.microphonePermission = "dismissed";
    //                 // this.app.props.showAudioConfiguration = true;
    //                 return;
    //             }
    //         }

    //         this.app.props.microphonePermission = await this.app.getMicrophonePermission();
    //         if (this.app.props.microphonePermission !== "granted") {
    //             // this.app.props.showAudioConfiguration = true;
    //             return;
    //         }
    //     }

    //     // if currentDevices still exist, are active then no need to show audioConfig
    //     // this.props.showAudioConfiguration = true;

    //     // This has two modes - after allowing userMedia we get a longer list!
    //     const mediaDevices = await navigator.mediaDevices.enumerateDevices();

    //     // does this throw??
    //     // const context = new AudioContext();
    //     // await context.resume();

    //     this.app.props.inputDevices = mediaDevices.filter(d => d.kind === "audioinput").map(d => ({ text: d.label, value: d.deviceId }));
    //     this.app.props.outputDevices = mediaDevices.filter(d => d.kind === "audiooutput").map(d => ({ text: d.label, value: d.deviceId }));

    //     if (!this.app.props.currentInputDeviceId) {
    //         this.app.props.currentInputDeviceId = this.app.props.inputDevices[0].value;
    //     }

    //     if (!this.app.props.currentOutputDeviceId) {
    //         this.app.props.currentOutputDeviceId = this.app.props.outputDevices[0].value;
    //     }
    // };

    // async onProbeDevice(detail: AudioConfigurationConfirm) {
    //     const stream = await navigator.mediaDevices.getUserMedia({audio: {advanced: [{ deviceId: detail.inputDeviceId}]}, video: false});
    //     const tracks = stream.getAudioTracks();
    //     console.log("probing", tracks[0], tracks[0].getCapabilities())
    //     const capabilities = tracks[0].getCapabilities();
    //     this.app.props.currentInputSampleRate = capabilities.sampleRate.max;
    //     this.app.props.currentInputChannelCount = capabilities.channelCount.max;
    //     // const sampleRate = caps.sampleRate;
    // };

    notify(source: IComponent, eventName: string, ...args: any): void {
        console.log("APP NOTIFY", source, eventName, args, source instanceof AudioConfiguration)
        if (source instanceof AudioConfiguration) {
            if (eventName === "ok") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(false);
            }
        }
    }

    async handle() {

        const permission = await tryGetMicrophonePermission();

        const audioConfiguration = new AudioConfiguration(this);
        audioConfiguration.setPermission(permission);

        const result = await this.app.modalDialogContainer.showModal(audioConfiguration);
        if (!result) {
            return;
        }

        console.log("audio configuration", audioConfiguration.currentOutputDeviceId, audioConfiguration.currentInputDeviceId)

        await this.app.setAudioDevice(audioConfiguration.currentOutputDeviceId, audioConfiguration.currentInputDeviceId);
        // this.app.device = new AudioDevice();
        // await this.app.device.create(audioConfiguration.currentOutputDeviceId, audioConfiguration.currentInputDeviceId);

        // this.app.player = new Player(this.song, this.instrumentFactories, this.context);

        // eller på device, eller på ver pattern
        // this.app.emit("deviceChanged");

        // // TODO; async - await until closed, 
        // // now the modal can call resolve too? looks
        // // const permission = await this.app.tryGetMicrophonePermission();

        // await this.app.showModal("Audio Configuration", (resolve) => [
        //     new AudioConfiguration({
        //         currentInputDeviceId: () => this.app.props.currentInputDeviceId,
        //         currentOutputDeviceId: () => this.app.props.currentOutputDeviceId,
        //         // inputDevices: () => this.app.props.inputDevices,
        //         // outputDevices: () => this.app.props.outputDevices,
        //         // microphonePermission: () => this.app.props.microphonePermission,
        //         // currentInputSampleRate: () => this.app.props.currentInputSampleRate,
        //         // currentInputChannelCount: () => this.app.props.currentInputChannelCount,
        //         // currentInputDeviceCapabilities: () => this.props.currentInputDeviceCapabilities,
        //         // inputMode: () => this.app.props.inputMode, // stereo, left, rigt
        //         inputSignal: 0, // this gonna be updated by recorder event or something
        //         close: () => { resolve() },
        //         confirm: e => { this.onConfirmDevice(e); resolve() },
        //         refresh: () => {}, // this.onDeviceChange(),
        //         change: e => {}, // this.onProbeDevice(e),
        //     })]);
    }
}