import { Appl } from "../../App";
import { MixerPanel } from "../../components/MixerPanel";
import { PinsPanel } from "../../components/PinsPanel";
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

        const panel = await this.app.executeCommand("show-pins") as PinsPanel;
        panel.bindInstrument(instrument);
    }
}
