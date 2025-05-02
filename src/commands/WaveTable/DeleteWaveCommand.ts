import { Appl } from "../../App";
import { WavesPanel } from "../../components/WavesPanel";
import { showCreateNewWaveDialog } from "../../dialogs/CreateNewWaveDialog";
import { ICommand } from "../../nutz";

export class DeleteWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WavesPanel) {
        this.app = component.app;
    }

    async handle() {
        if (!this.component.instrument) {
            return;
        }

        if (this.component.list.selectedIndex === -1) {
            return;
        }

        const wave = this.component.instrument.waves[this.component.list.selectedIndex];
        this.app.song.deleteWave(this.component.instrument, wave);
    }
}