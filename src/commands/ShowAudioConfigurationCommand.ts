import { Appl } from "../App";
import { AudioDevice } from "../audio/AudioDevice";
import { tryGetMicrophonePermission } from "../audio/AudioUtil";
import { AudioConfiguration } from "../components/AudioConfiguration";
import { IComponent, INotify } from "../nutz";

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
        audioConfiguration.setPermission(permission);

        const result = await this.app.modalDialogContainer.showModal("Audio Configuration", audioConfiguration);
        if (!result) {
            return;
        }

        await this.app.setAudioDevice(audioConfiguration.currentOutputDeviceId, audioConfiguration.currentInputDeviceId);
    }
}