import { PatternFrame } from "../../components/PatternFrame";
import { PatternPanel } from "../../components/PatternPanel";
import { ICommand } from "../../nutz";

export class DuplicatePatternCommand implements ICommand {
    constructor(private component: PatternPanel) {
    }

    async handle(...args: any[]) {
        const p = this.component.app.song.duplicatePattern(this.component.patternEditor.pattern);
        const panel = await this.component.app.executeCommand("show-pattern-editor") as PatternFrame;
        panel.setPattern(p);
    }
}
