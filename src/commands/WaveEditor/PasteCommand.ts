import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { readClipboardWave, writeClipboardWave } from "../../Clipboard";
import { ICommand } from "../../nutz";

export class PasteCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveView.waveEditor;
        if (!waveEditor.selection) {
            return;
        }

        const wavFile = await readClipboardWave();

        if (!wavFile) {
            return;
        }

        let offset = 0;
        if (waveEditor.selection) {
            offset = Math.max(waveEditor.selection.start, waveEditor.selection.end);
        }

        const wave = this.component.wave;
        wave.insertRange(offset, wavFile.channels);
        this.app.song.updateWave(wave, wave.name, wave.note, wave.selection, wave.zoom);

    }
}
