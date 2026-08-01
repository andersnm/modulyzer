import { Appl } from "../../App";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";

export class SetLoopEndCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        if (this.component.sequenceEditor.cursorTime + 1 <= this.app.song.loopStart) {
            return;
        }

        this.app.song.setLoop(this.app.song.loopStart, this.component.sequenceEditor.cursorTime + 1);
    }
}
