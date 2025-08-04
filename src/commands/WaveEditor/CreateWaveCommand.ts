import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { showCreateNewWaveDialog } from "../../dialogs/CreateNewWaveDialog";
import { ICommand } from "../../nutz";

export class CreateWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
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