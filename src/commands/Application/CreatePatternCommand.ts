import { Appl } from "../../App";
import { CreateWavePanel } from "../../components/CreateWavePanel";
import { ICommand, IComponent, INotify } from "../../nutz";

export class CreatePatternCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        // TODO: modal w/name, length, subdivision, + editor
        this.app.song.createPattern("Untitled", 16) //app.executeCommand("show-create-new-pattern"),
    }
}