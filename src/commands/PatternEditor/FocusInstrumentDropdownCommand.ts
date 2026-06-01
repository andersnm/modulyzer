import { Appl } from "../../App";
import { PatternFrame } from "../../components/PatternFrame";
import { ICommand } from "../../nutz";

export class FocusInstrumentDropdownCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        this.component.patternList.instrumentDropdown.instrumentSelect.showPicker();
    }
}
