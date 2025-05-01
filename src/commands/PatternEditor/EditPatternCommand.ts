import { Appl } from "../../App";
import { PatternPanel } from "../../components/PatternPanel";
import { showPatternPropertiesDialog } from "../../dialogs/PatternPropertiesDialog";
import { ICommand } from "../../nutz";

export class EditPatternCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const pattern = this.component.patternEditor.pattern;
        if (!pattern) {
            console.error("Not editing wave");
            return;
        }

        return await showPatternPropertiesDialog(this.app, pattern);
    }
}
