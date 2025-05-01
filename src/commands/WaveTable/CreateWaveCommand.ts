import { Appl } from "../../App";
import { WavesPanel } from "../../components/WavesPanel";
import { showCreateNewWaveDialog } from "../../dialogs/CreateNewWaveDialog";
import { ICommand } from "../../nutz";

export class CreateWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WavesPanel) {
        this.app = component.app;
    }

    async handle() {
        if (!this.component.instrument) {
            console.log("no instrument")
            return;
        }

        return await showCreateNewWaveDialog(this.app, this.component.instrument);
    }
}