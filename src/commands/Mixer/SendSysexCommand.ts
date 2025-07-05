import { Appl } from "../../App";
import { MixerPanel } from "../../components/MixerPanel";
import { ICommand } from "../../nutz";

export class SendSysexCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
    }
}
