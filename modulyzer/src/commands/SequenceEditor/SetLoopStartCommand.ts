import { Appl } from "../../App";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";

export class SetLoopStartCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        if (this.component.sequenceEditor.cursorTime >= this.app.song.loopEnd) {
            return;
        }

        this.app.song.setLoop(this.component.sequenceEditor.cursorTime, this.app.song.loopEnd);
    }
}
