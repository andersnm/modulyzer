import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class ZoomClearCommand implements ICommand {
    constructor(private component: WaveFrame) {
    }

    async handle(...args: any[]) {
        this.component.waveView.waveEditor.clearZoom();
    }
}
