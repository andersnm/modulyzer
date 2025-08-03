import { getNewPatternName } from "../../components/PatternEditorHelper";
import { PatternFrame } from "../../components/PatternFrame";
import { ICommand } from "../../nutz";

export class CreatePatternCommand implements ICommand {
    constructor(private component: PatternFrame) {
    }

    async handle() {
        if (!this.component.instrument) {
            return;
        }

        const name = getNewPatternName(this.component.instrument.patterns);
        const pattern = this.component.app.song.createPattern(this.component.instrument, name, 32, 4);
        // TODO: add default columns, same as in create-instrument
    }
}