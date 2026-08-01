import { Appl } from "../../App";
import { InstrumentPicker } from "../../components/InstrumentPicker";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";

export class AddColumnCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const panel = new InstrumentPicker(this.app);

        const result = await this.app.modalDialogContainer.showModal("Add Sequence Column", panel);
        if (!result) {
            return;
        }

        const instrument = this.app.song.instruments[panel.instrumentIndex];
        if (!instrument) {
            throw new Error();
        }

        const factory = this.app.instrumentFactories.find(i => i.identifier === instrument.instrumentId);

        if (factory.useSequenceType === null || factory.useSequenceType === "pattern") {
            const column = this.app.song.createPatternSequenceColumn(instrument);
            const pa = this.app.song.createPattern(instrument, "00", 64, 4);
            this.app.song.createPatternColumn(pa, instrument, "midinote");
        } else if (factory.useSequenceType === "wave") {
            const column = this.app.song.createWaveSequenceColumn(instrument);
        }
    }
}
