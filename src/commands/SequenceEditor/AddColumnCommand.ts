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
        this.app.song.createSequenceColumn(instrument);
    }
}
