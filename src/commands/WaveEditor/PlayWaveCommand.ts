import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";
import { ICommand } from "../../nutz";

export class PlayWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WavePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveEditor;
        if (!this.component.document) {
            return ;
        }

        await this.app.wavePlayer.playWave(this.component.document);
    }
}
