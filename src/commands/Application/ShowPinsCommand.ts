import { Appl } from "../../App";
import { PatternsPanel } from "../../components/PatternsPanel";
import { PinsPanel } from "../../components/PinsPanel";
import { ICommand } from "../../nutz";

export class ShowPinsCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const tabIndex = this.app.sidebarTabs.tabs.tabs.findIndex(t => t.label === "Pins");
        if (tabIndex !== -1) {
            this.app.sidebarTabs.setCurrentTab(tabIndex);
            return this.app.sidebarTabs.tabContent[tabIndex];
        }

        const panel = new PinsPanel(this.app);
        this.app.sidebarTabs.addTab("Pins", panel);
        this.app.sidebarTabs.setCurrentTab(this.app.sidebarTabs.tabs.tabs.length - 1);
        return panel;
    }
}
