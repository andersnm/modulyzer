import { Appl } from "../../App";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";

export class MuteCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle() {
        const sequenceEditor = this.component.sequenceEditor;

        const sequenceColumn = this.app.song.sequenceColumns[sequenceEditor.cursorColumn];
        if (!sequenceColumn) {
            return;
        }

        const instrument = sequenceColumn.instrument;
        this.app.song.setInstrumentMuted(instrument, !instrument.muted);
    }
}
