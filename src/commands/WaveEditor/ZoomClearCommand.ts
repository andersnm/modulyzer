import { WavePanel } from "../../components/WavePanel";
import { ICommand } from "../../nutz";

export class ZoomClearCommand implements ICommand {
    constructor(private component: WavePanel) {
    }

    async handle(...args: any[]) {
        this.component.waveEditor.clearZoom();
    }
}
