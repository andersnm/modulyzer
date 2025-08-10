import { Appl } from "../../App";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";

export class DeleteColumnCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const columnIndex = this.component.sequenceEditor.cursorColumn;
        const column = this.app.song.sequenceColumns[columnIndex];
        if (!column) {
            return;
        }

        this.app.song.deleteSequenceColumn(column);
    }
}
