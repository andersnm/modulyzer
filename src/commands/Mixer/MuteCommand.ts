import { Appl } from "../../App";
import { MixerFrame } from "../../components/MixerFrame";
import { MixerPanel } from "../../components/MixerPanel";
import { ICommand } from "../../nutz";

export class MuteCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const instrument = this.component.mixerCanvas.selectedInstrument;
        if (!instrument) {
            return;
        }

        this.component.app.song.setInstrumentMuted(instrument, !instrument.muted)
    }
}
