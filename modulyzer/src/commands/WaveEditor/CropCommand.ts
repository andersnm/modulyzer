import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class CropCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const selection = this.component.waveView.getSelection();
        if (!selection) {
            return;
        }

        const wave = this.component.wave;
        wave.deleteRange(selection.end, wave.sampleCount);
        wave.deleteRange(0, selection.start);

        this.component.waveView.clearSelection();
        this.component.waveView.clearZoom();

        this.app.song.updateWave(wave, wave.name, wave.note, null, null, wave.sampleRate);
    }
}
