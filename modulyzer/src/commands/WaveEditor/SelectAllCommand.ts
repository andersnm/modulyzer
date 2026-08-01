import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class SelectAllCommand implements ICommand {
    constructor(private component: WaveFrame) {
    }

    async handle(...args: any[]) {
        this.component.waveView.setSelection(0, this.component.wave.sampleCount);
    }
}
