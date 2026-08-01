import { Appl } from "../../App";
import { WaveFrame } from "../../components/WaveFrame";
import { ICommand } from "../../nutz";

export class FocusInstrumentDropdownCommand implements ICommand {
    app: Appl;

    constructor(private component: WaveFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        this.component.waveList.instrumentDropdown.instrumentSelect.showPicker();
    }
}
