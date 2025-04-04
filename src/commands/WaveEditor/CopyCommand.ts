import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";
import { writeClipboardWave } from "../../Clipboard";
import { ICommand } from "../../nutz";

export class CopyCommand implements ICommand {
    app: Appl;

    constructor(private component: WavePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveEditor;
        if (!waveEditor.selection) {
            return;
        }

        const start = Math.min(waveEditor.selection.start, waveEditor.selection.end);
        const end = Math.max(waveEditor.selection.start, waveEditor.selection.end);

        const wave = this.component.document;
        const rangeBuffers = wave.copyRange(start, end);
        await writeClipboardWave(wave.name, wave.sampleRate, rangeBuffers);
    }
}
