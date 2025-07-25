import { Appl } from "../../App";
import { tryGetMicrophonePermission } from "../../audio/AudioUtil";
import { AudioConfiguration } from "../../components/AudioConfiguration";

export class ShowAudioConfigurationCommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const permission = await tryGetMicrophonePermission();

        const audioConfiguration = new AudioConfiguration(this.app);
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