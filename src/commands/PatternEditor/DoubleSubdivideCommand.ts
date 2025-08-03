import { PatternFrame } from "../../components/PatternFrame";
import { ICommand } from "../../nutz";

export class DoubleSubdivideCommand implements ICommand {
    constructor(private component: PatternFrame) {
    }

    handle(...args: any[]) {
        const app = this.component.app;
        const pattern = this.component.pattern;
        app.song.updatePattern(pattern, pattern.name, pattern.duration * 2, pattern.subdivision * 2, pattern.swing);

        for (let column of pattern.columns) {
            for (let event of column.events) {
                app.song.updatePatternEvent(event, event.time * 2, event.value, event.data0, event.data1);
            }
        }
    }
}
