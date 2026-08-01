import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class ZoomOutCommand implements ICommand {
    constructor(private component: WaveFrame) {
    }

    async handle(...args: any[]) {
        const waveEditor = this.component.waveView.waveEditor;
        if (!waveEditor.selection) {
            return;
        }

        this.component.waveView.zoomRelative(1.1);
    }
}
