import { Appl } from "../../App";
import { MixerFrame } from "../../components/MixerFrame";
import { ICommand } from "../../nutz";

export class ShowMixerCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Mixer");
        if (tabIndex !== -1) {
            this.app.mainTabs.setCurrentTab(tabIndex);
            return this.app.mainTabs.tabContent[tabIndex];
        }

        const content = new MixerFrame(this.app);
        this.app.mainTabs.addTab("Mixer", content);
        return content;
    }
}
