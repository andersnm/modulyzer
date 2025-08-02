import { PatternPanel } from "../../components/PatternPanel";
import { PatternsPanel } from "../../components/PatternsPanel";
import { ICommand } from "../../nutz";

export class DeletePatternCommand implements ICommand {
    constructor(private component: PatternsPanel) {
    }

    async handle(...args: any[]) {
        const i = this.component.list.selectedIndex;
        if (i === -1) {
            return ;
        }

        const pattern = this.component.frame.instrument.patterns[i];
        const p = this.component.app.song.deletePattern(pattern);
    }
}
