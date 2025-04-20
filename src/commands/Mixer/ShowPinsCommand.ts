import { Appl } from "../../App";
import { MixerPanel } from "../../components/MixerPanel";
import { PinsPanel } from "../../components/PinsPanel";
import { ICommand } from "../../nutz";

export class ShowPinsCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const instrument = this.component.mixerCanvas.selectedInstrument;
        if (!instrument) {
            return;
        }

        const tabIndex = this.app.sidebarTabs.tabs.tabs.findIndex(t => t.label === "Pins");
        if (tabIndex === -1) {
            return;
        }

        const panel = this.app.sidebarTabs.tabContent[tabIndex] as PinsPanel;
        panel.bindInstrument(instrument);
        this.app.sidebarTabs.setCurrentTab(tabIndex);
    }
}
