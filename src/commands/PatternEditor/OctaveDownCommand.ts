import { PatternPanel } from "../../components/PatternPanel";
import { ICommand } from "../../nutz";

export class OctaveDownCommand implements ICommand {
    constructor(private component: PatternPanel) {
    }

    handle(...args: any[]) {
        const octave = Math.max(this.component.patternEditor.octave - 1, 1);
        this.component.octaveInput.input.valueAsNumber = octave;
        this.component.patternEditor.octave = octave;
    }
}