import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";

export class ShowWavesCommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const panel = await this.app.executeCommand("show-wave-editor") as WaveFrame;
        panel.waveList.container.focus();
        return panel;
    }
}
