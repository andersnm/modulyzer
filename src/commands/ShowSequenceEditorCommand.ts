import { Appl } from "../App";
import { SequencePanel } from "../components/SequencePanel";

export class ShowSequenceEditorCommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Sequence");
        if (tabIndex !== -1) {
            this.app.mainTabs.setCurrentTab(tabIndex);
            return;
        }

        const sq = new SequencePanel(this.app);
        // want toolbar and maybe stuff on top
        this.app.mainTabs.addTab("Sequence", sq);

    }
}