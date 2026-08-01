import { Appl } from "../../App";
import { MixerPanel } from "../../components/MixerPanel";
import { WavesPanel } from "../../components/WavesPanel";
import { ICommand } from "../../nutz";

export class GotoWaveTableCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const panel = await this.app.executeCommand("show-waves") as WavesPanel;

        const instrument = this.component.mixerCanvas.selectedInstrument;
        if (!instrument) {
            console.log("No instrument selected")
            return;
        }

        const factory = this.app.instrumentFactories.find(f => f.identifier === instrument.instrumentId);
        if (!factory.useWaveTable) {
            console.log("Instrument does not have wave table")
            return;
        }

        panel.setInstrument(instrument);
    }
}
