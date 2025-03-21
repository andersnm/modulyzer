import { Appl } from "../App";
import { AudioDevice } from "../audio/AudioDevice";
import { tryGetMicrophonePermission } from "../audio/AudioUtil";
import { AudioConfiguration } from "../components/AudioConfiguration";
import { RecordingsPanel } from "../components/RecordingsPanel";

export class ShowRecordingsCommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const tabIndex = this.app.sidebarTabs.tabs.tabs.findIndex(t => t.label === "Waves");
        if (tabIndex !== -1) {
            this.app.sidebarTabs.setCurrentTab(tabIndex);
            return;
        }

        const recordings = new RecordingsPanel(this.app);
        this.app.sidebarTabs.addTab("Waves", recordings);

        this.app.sidebarTabs.setCurrentTab(this.app.sidebarTabs.tabs.tabs.length - 1);
    }
}