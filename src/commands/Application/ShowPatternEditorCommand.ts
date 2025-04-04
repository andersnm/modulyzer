import { Appl } from "../../App";
import { PatternDocument } from "../../audio/SongDocument";
import { PatternPanel } from "../../components/PatternPanel";

export class ShowPatternEditorCommand {
    constructor(private app: Appl) {
    }

    async handle(pattern?: PatternDocument) {

        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Pattern");
        if (tabIndex !== -1) {
            this.app.mainTabs.setCurrentTab(tabIndex);

            if (pattern) {
                const pq = this.app.mainTabs.tabContent[tabIndex] as PatternPanel;
                pq.setPattern(pattern);
            }

            return;
        }

        const pq = new PatternPanel(this.app);
        if (pattern) {
            pq.setPattern(pattern);
        } else if (this.app.song.patterns[0]) {
            pq.setPattern(this.app.song.patterns[0]);
        } else {
            const dummy = new PatternDocument();
            pq.setPattern(dummy);
        }

        this.app.mainTabs.addTab("Pattern", pq);

        this.app.mainTabs.setCurrentTab(this.app.mainTabs.tabs.tabs.length - 1);
    }
}