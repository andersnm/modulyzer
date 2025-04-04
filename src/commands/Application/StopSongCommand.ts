import { Appl } from "../../App";
import { ICommand } from "../../nutz";

export class StopSongCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        this.app.player.stop();
    }
}
