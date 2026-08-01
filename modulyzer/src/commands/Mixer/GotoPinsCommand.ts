import { Appl } from "../../App";
import { MixerFrame } from "../../components/MixerFrame";
import { MixerPanel } from "../../components/MixerPanel";
import { ICommand } from "../../nutz";

export class GotoPinsCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const instrument = this.component.mixerCanvas.selectedInstrument;
        if (!instrument) {
            return;
        }

        const panel = await this.app.executeCommand("show-mixer") as MixerFrame;
        await panel.list.bindInstrument(instrument);
    }
}
