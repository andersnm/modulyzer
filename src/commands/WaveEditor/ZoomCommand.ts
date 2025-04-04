import { WavePanel } from "../../components/WavePanel";
import { ICommand } from "../../nutz";

export class ZoomCommand implements ICommand {
    constructor(private component: WavePanel) {
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveEditor;
        if (!waveEditor.selection) {
            return;
        }

        this.component.zoomSelection();
    }
}
