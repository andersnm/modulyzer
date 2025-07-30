import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
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
        const panel = await this.app.executeCommand("show-wave-editor") as WaveFrame;
        panel.setWave(wave);
    }
}
