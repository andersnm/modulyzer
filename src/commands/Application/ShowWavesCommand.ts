import { Appl } from "../../App";
import { WavesPanel } from "../../components/WavesPanel";

export class ShowWavesCommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const tabIndex = this.app.sidebarTabs.tabs.tabs.findIndex(t => t.label === "Waves");
        if (tabIndex !== -1) {
            this.app.sidebarTabs.setCurrentTab(tabIndex);
            return this.app.sidebarTabs.tabContent[tabIndex];
        }

        const panel = new WavesPanel(this.app);
        this.app.sidebarTabs.addTab("Waves", panel);
        this.app.sidebarTabs.setCurrentTab(this.app.sidebarTabs.tabs.tabs.length - 1);
        return panel;
    }
}
