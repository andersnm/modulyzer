import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class DeleteCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveView.waveEditor;
        if (!waveEditor.selection) {
            return;
        }

        const start = Math.min(waveEditor.selection.start, waveEditor.selection.end);
        const end = Math.max(waveEditor.selection.start, waveEditor.selection.end);

        const wave = this.component.wave;
        wave.deleteRange(start, end);
        waveEditor.clearSelection();
        this.app.song.updateWave(wave, wave.name, wave.note, null, wave.zoom);
    }
}
