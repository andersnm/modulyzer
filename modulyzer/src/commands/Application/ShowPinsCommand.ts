import { Appl } from "../../App";
import { MixerFrame } from "../../components/MixerFrame";
import { ICommand } from "../../nutz";

export class ShowPinsCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const panel = await this.app.executeCommand("show-mixer") as MixerFrame;
        panel.list.container.focus();
    }
}
