import { Appl } from "../../App";
import { ICommand } from "../../nutz";

export class ClearSongCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        if (!window.confirm("This will clear everything. Are you sure?")) {
            return;
        }

        this.app.song.clearAll();
        this.app.projectFile = null;
    }
}
