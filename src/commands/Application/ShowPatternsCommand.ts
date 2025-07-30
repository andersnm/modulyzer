import { Appl } from "../../App";
import { PatternFrame } from "../../components/PatternFrame";

export class ShowPatternsCommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const panel = await this.app.executeCommand("show-pattern-editor") as PatternFrame;
        panel.patternList.container.focus();
        return panel;
    }
}
