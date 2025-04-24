import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";
import { WavesPanel } from "../../components/WavesPanel";

export class GotoWaveEditorCommand {
    app: Appl;

    constructor(private component: WavesPanel) {
        this.app = component.app;
    }

    async handle() {
        console.log("goto")
        if (!this.component.instrument) {
            return;
        }

        if (this.component.list.selectedIndex === -1) {
            return;
        }

        const wave = this.component.instrument.waves[this.component.list.selectedIndex];
        const panel = await this.app.executeCommand("show-wave-editor") as WavePanel;
        panel.setWave(wave);
    }
}
