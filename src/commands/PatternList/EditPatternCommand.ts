import { Appl } from "../../App";
import { PatternPanel } from "../../components/PatternPanel";
import { PatternPropertiesPanel } from "../../components/PatternPropertiesPanel";
import { PatternsPanel } from "../../components/PatternsPanel";
import { ICommand, IComponent, INotify } from "../../nutz";

export class EditPatternCommand implements ICommand, INotify {
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

        const patternPanel = new PatternPropertiesPanel(this.app, this, pattern.name, pattern.duration, pattern.subdivision, pattern.swing);
        const result = await this.app.modalDialogContainer.showModal("Pattern Properties", patternPanel);

        if (!result) {
            return;
        }

        this.app.song.updatePattern(pattern, patternPanel.name, patternPanel.length, patternPanel.subdivision, patternPanel.swing);
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof PatternPropertiesPanel) {
            if (eventName === "ok") {
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                this.app.modalDialogContainer.endModal(false);
            }
        }
    }
}
