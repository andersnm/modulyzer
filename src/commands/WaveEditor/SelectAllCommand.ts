import { WaveFrame } from "../../components/WaveFrame";
import { WavePanel } from "../../components/WavePanel";
import { ICommand } from "../../nutz";

export class SelectAllCommand implements ICommand {
    constructor(private component: WaveFrame) {
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveView.waveEditor;
        waveEditor.setSelection(0, this.component.wave.sampleCount);
    }
}
