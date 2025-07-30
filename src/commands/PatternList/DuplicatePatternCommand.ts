import { PatternFrame } from "../../components/PatternFrame";
import { PatternsPanel } from "../../components/PatternsPanel";
import { ICommand } from "../../nutz";

export class DuplicatePatternCommand implements ICommand {
    constructor(private component: PatternsPanel) {
    }

    async handle(...args: any[]) {
        const i = this.component.list.selectedIndex;
        if (i === -1) {
            return ;
        }

        const pattern = this.component.app.song.patterns[i];
        const p = this.component.app.song.duplicatePattern(pattern);
        const panel = await this.component.app.executeCommand("show-pattern-editor") as PatternFrame;
        panel.setPattern(p);
    }
}
