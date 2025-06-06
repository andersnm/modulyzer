import { Appl } from "../../App";
import { tryGetMicrophonePermission } from "../../audio/AudioUtil";
import { AudioConfiguration } from "../../components/AudioConfiguration";
import { IComponent, INotify } from "../../nutz";

export class ShowAudioConfigurationCommand implements INotify {
    constructor(private app: Appl) {
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
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
        audioConfiguration.microphonePermission = permission;
        audioConfiguration.latencySec = this.app.device.latencySec;
        audioConfiguration.cancelable = !!this.app.device.context;
        audioConfiguration.currentOutputDeviceId = this.app.device.outputDeviceId;
        audioConfiguration.currentInputDeviceId = this.app.device.inputDeviceId;

        const result = await this.app.modalDialogContainer.showModal("Audio Configuration", audioConfiguration, false);
        if (!result) {
            return;
        }

        await this.app.setAudioDevice(audioConfiguration.currentOutputDeviceId, audioConfiguration.currentInputDeviceId, audioConfiguration.latencySec);
    }
}