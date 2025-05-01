import { Appl } from "../../App";
import { PatternsPanel } from "../../components/PatternsPanel";
import { showPatternPropertiesDialog } from "../../dialogs/PatternPropertiesDialog";
import { ICommand } from "../../nutz";

export class EditPatternCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternsPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const i = this.component.list.selectedIndex;
        if (i === -1) {
            return ;
        }

        const pattern = this.component.app.song.patterns[i];
        if (!pattern) {
            return;
        }

        return await showPatternPropertiesDialog(this.app, pattern);
    }
}
