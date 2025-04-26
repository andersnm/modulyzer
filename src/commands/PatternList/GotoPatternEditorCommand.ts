import { PatternPanel } from "../../components/PatternPanel";
import { PatternsPanel } from "../../components/PatternsPanel";
import { ICommand } from "../../nutz";

export class GotoPatternEditorCommand implements ICommand {
    constructor(private component: PatternsPanel) {
    }

    async handle(...args: any[]) {
        const i = this.component.list.selectedIndex;
        if (i === -1) {
            return ;
        }

        const pattern = this.component.app.song.patterns[i];
        const panel = await this.component.app.executeCommand("show-pattern-editor") as PatternPanel;
        panel.setPattern(pattern);
    }
}
