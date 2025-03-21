import { Appl } from "../App";
import { AudioDevice } from "../audio/AudioDevice";
import { tryGetMicrophonePermission } from "../audio/AudioUtil";
import { AudioConfiguration } from "../components/AudioConfiguration";
import { PatternsPanel } from "../components/PatternsPanel";
import { RecordingsPanel } from "../components/RecordingsPanel";

export class ShowPatternsCommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const tabIndex = this.app.sidebarTabs.tabs.tabs.findIndex(t => t.label === "Patterns");
        if (tabIndex !== -1) {
            this.app.sidebarTabs.setCurrentTab(tabIndex);
            return;
        }

        const recordings = new PatternsPanel(this.app);
        this.app.sidebarTabs.addTab("Patterns", recordings);

        this.app.sidebarTabs.setCurrentTab(this.app.sidebarTabs.tabs.tabs.length - 1);
    }
}