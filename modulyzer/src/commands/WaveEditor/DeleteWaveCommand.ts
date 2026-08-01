import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class DeleteWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
        this.app = component.app;
    }

    async handle() {
        if (!this.component.wave) {
            return;
        }

        this.app.song.deleteWave(this.component.instrument, this.component.wave);
    }
}