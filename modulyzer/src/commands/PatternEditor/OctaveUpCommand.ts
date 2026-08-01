import { PatternFrame } from "../../components/PatternFrame";
import { ICommand } from "../../nutz";

export class OctaveUpCommand implements ICommand {
    constructor(private component: PatternFrame) {
    }

    handle(...args: any[]) {
        const octave = Math.min(this.component.patternView.patternEditor.octave + 1, 7);
        this.component.patternView.octaveInput.input.valueAsNumber = octave;
        this.component.patternView.patternEditor.octave = octave;
    }
}