import { getNewPatternName } from "../../components/PatternEditorHelper";
import { PatternsPanel } from "../../components/PatternsPanel";
import { ICommand } from "../../nutz";

export class CreatePatternCommand implements ICommand {
    constructor(private component: PatternsPanel) {
    }

    async handle() {
        if (!this.component.frame.instrument) {
            return;
        }

        const name = getNewPatternName(this.component.frame.instrument.patterns);
        const pattern = this.component.app.song.createPattern(this.component.frame.instrument, name, 32, 4);
        // TODO: add default columns, same as in create-instrument
    }
}