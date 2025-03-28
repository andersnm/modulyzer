import { Appl } from "../App";
import { RecordingsPanel } from "../components/WavesPanel";

export class ShowWavesCommand {
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
