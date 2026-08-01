import { PatternFrame } from "../../components/PatternFrame";
import { ICommand } from "../../nutz";

export class DuplicatePatternCommand implements ICommand {
    constructor(private component: PatternFrame) {
    }

    async handle(...args: any[]) {
        const p = this.component.app.song.duplicatePattern(this.component.pattern);
        this.component.setPattern(p);
    }
}
