import { Appl } from "../../App";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";

export class AddColumnCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        this.app.song.createSequenceColumn();
    }
}
