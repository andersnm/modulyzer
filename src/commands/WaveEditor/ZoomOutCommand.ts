import { WavePanel } from "../../components/WavePanel";
import { ICommand } from "../../nutz";

export class ZoomOutCommand implements ICommand {
    constructor(private component: WavePanel) {
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveEditor;
        if (!waveEditor.selection) {
            return;
        }

        this.component.zoomRelative(1.1)
    }
}
