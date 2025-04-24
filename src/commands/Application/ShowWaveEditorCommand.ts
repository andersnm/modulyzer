import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";

export class ShowWaveEditorCommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Wave");
        if (tabIndex !== -1) {
            this.app.mainTabs.setCurrentTab(tabIndex);
            return this.app.mainTabs.tabContent[tabIndex];
        }

        const panel = new WavePanel(this.app);
        this.app.mainTabs.addTab("Wave", panel);
        this.app.mainTabs.setCurrentTab(this.app.mainTabs.tabs.tabs.length - 1);
        return panel;
    }
}
