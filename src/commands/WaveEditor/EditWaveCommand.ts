import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";
import { showWavePropertiesDialog } from "../../dialogs/WavePropertiesDialog";
import { ICommand } from "../../nutz";

export class EditWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WavePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        if (!this.component.document) {
            console.error("Not editing wave");
            return;
        }

        await showWavePropertiesDialog(this.app, this.component.document);
    }
}
