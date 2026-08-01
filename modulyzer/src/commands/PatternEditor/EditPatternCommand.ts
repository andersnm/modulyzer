import { Appl } from "../../App";
import { PatternFrame } from "../../components/PatternFrame";
import { showPatternPropertiesDialog } from "../../dialogs/PatternPropertiesDialog";
import { ICommand } from "../../nutz";

export class EditPatternCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const pattern = this.component.pattern;
        if (!pattern) {
            console.error("Not editing pattern");
            return;
        }

        return await showPatternPropertiesDialog(this.app, pattern);
    }
}
