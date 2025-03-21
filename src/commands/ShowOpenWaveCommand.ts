import { Appl } from "../App";
import { AudioDevice } from "../audio/AudioDevice";
import { tryGetMicrophonePermission } from "../audio/AudioUtil";
import { AudioConfiguration } from "../components/AudioConfiguration";
import { OpenWavePanel } from "../components/RecordingsPanel";
import { IComponent, INotify } from "../nutz";

export class ShowOpenWaveCommand implements INotify {
    constructor(private app: Appl) {

        // og vi kan ha lokale props - hva slags pattern er dette!
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        console.log("APP NOTIFY", source, eventName, args, source instanceof AudioConfiguration)
        if (source instanceof AudioConfiguration) {
            if (eventName === "ok") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal("cancel");
            }
        }
    }

    async handle() {

        const openPanel = new OpenWavePanel(this.app);

        const result = await this.app.modalDialogContainer.showModal(openPanel);

        console.log("open wave", result);
    }
}