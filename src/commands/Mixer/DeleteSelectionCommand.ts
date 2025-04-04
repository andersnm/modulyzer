import { Appl } from "../../App";
import { MixerPanel } from "../../components/MixerPanel";
import { ICommand } from "../../nutz";

export class DeleteSelectionCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        if (this.component.mixerCanvas.selectedConnection) {
            this.app.song.deleteConnection(this.component.mixerCanvas.selectedConnection);
        }

        if (this.component.mixerCanvas.selectedInstrument) {
            this.app.song.deleteInstrument(this.component.mixerCanvas.selectedInstrument);
        }
    }
}
