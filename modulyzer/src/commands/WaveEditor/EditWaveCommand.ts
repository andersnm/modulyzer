import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { showWavePropertiesDialog } from "../../dialogs/WavePropertiesDialog";
import { ICommand } from "../../nutz";

export class EditWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        if (!this.component.wave) {
            console.error("Not editing wave");
            return;
        }

        await showWavePropertiesDialog(this.app, this.component.wave);
    }
}
