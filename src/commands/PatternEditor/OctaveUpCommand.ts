import { PatternPanel } from "../../components/PatternPanel";
import { ICommand } from "../../nutz";

export class OctaveUpCommand implements ICommand {
    constructor(private component: PatternPanel) {
    }

    handle(...args: any[]) {
        const octave = Math.min(this.component.patternEditor.octave + 1, 7);
        this.component.octaveInput.input.valueAsNumber = octave;
        this.component.patternEditor.octave = octave;
    }
}