import { Appl } from "../../App";
import { MixerPanel } from "../../components/MixerPanel";
import { ICommand } from "../../nutz";

export class ShowMixerCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Mixer");
        if (tabIndex !== -1) {
            this.app.mainTabs.setCurrentTab(tabIndex);
            return;
        }

        const content = new MixerPanel(this.app);
        this.app.mainTabs.addTab("Mixer", content);
    }
}
