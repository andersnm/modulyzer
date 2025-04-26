import { Appl } from "../../App";
import { getNewPatternName } from "../../components/PatternEditorHelper";
import { ICommand } from "../../nutz";

export class CreatePatternCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const name = getNewPatternName(this.app.song.patterns);
        this.app.song.createPattern(name, 32, 4);
    }
}