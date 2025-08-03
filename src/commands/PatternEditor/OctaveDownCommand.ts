import { PatternFrame } from "../../components/PatternFrame";
import { PatternPanel } from "../../components/PatternPanel";
import { ICommand } from "../../nutz";

export class OctaveDownCommand implements ICommand {
    constructor(private component: PatternFrame) {
    }

    handle(...args: any[]) {
        const octave = Math.max(this.component.patternView.patternEditor.octave - 1, 1);
        this.component.patternView.octaveInput.input.valueAsNumber = octave;
        this.component.patternView.patternEditor.octave = octave;
    }
}