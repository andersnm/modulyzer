import { Appl } from "../../App";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";

export class PlaySongFromCursorCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Sequence");
        const panel = this.app.mainTabs.tabContent[tabIndex] as SequencePanel;
        this.app.player.play(panel.sequenceEditor.cursorTime);
    }
}
