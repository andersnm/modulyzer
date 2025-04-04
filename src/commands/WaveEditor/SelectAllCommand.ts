import { WavePanel } from "../../components/WavePanel";
import { ICommand } from "../../nutz";

export class SelectAllCommand implements ICommand {
    constructor(private component: WavePanel) {
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveEditor;
        waveEditor.setSelection(0, this.component.document.sampleCount);
    }
}
