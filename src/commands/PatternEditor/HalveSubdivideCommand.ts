import { PatternPanel } from "../../components/PatternPanel";
import { ICommand } from "../../nutz";

export class HalveSubdivideCommand implements ICommand {
    constructor(private component: PatternPanel) {
    }

    handle(...args: any[]) {
        const app = this.component.app;
        const pattern = this.component.patternEditor.pattern;
        if ((pattern.subdivision % 2) == 1) {
            console.warn("TODO: not subdividing odd subdivision")
            return;
        }

        app.song.updatePattern(pattern, pattern.name, pattern.duration / 2, pattern.subdivision / 2, pattern.swing);

        for (let column of pattern.columns) {
            for (let event of column.events) {
                // TODO: odd timestamps
                app.song.updatePatternEvent(event, event.time / 2, event.value, event.data0, event.data1);
            }
        }
    }
}
