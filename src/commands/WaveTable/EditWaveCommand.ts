import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";
import { WavesPanel } from "../../components/WavesPanel";
import { showWavePropertiesDialog } from "../../dialogs/WavePropertiesDialog";

export class EditWaveCommand {
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

        await showWavePropertiesDialog(this.app, wave);
    }
}
