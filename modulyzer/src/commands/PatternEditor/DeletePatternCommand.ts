import { PatternFrame } from "../../components/PatternFrame";
import { ICommand } from "../../nutz";

export class DeletePatternCommand implements ICommand {
    constructor(private component: PatternFrame) {
    }

    async handle(...args: any[]) {
        if (!this.component.pattern) {
            return ;
        }

        this.component.app.song.deletePattern(this.component.pattern);
    }
}
