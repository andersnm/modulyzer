import { Appl } from "../../App";
import { PatternPanel } from "../../components/PatternPanel";

export class ShowPatternEditorCommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Pattern");
        if (tabIndex !== -1) {
            this.app.mainTabs.setCurrentTab(tabIndex);
            return this.app.mainTabs.tabContent[tabIndex] as PatternPanel;
        }

        const panel = new PatternPanel(this.app);
        this.app.mainTabs.addTab("Pattern", panel);
        this.app.mainTabs.setCurrentTab(this.app.mainTabs.tabs.tabs.length - 1);
        return panel;
    }
}