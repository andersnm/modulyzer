import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class PlayWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        if (!this.component.wave) {
            return ;
        }

        await this.app.wavePlayer.playWave(this.component.wave);
    }
}
