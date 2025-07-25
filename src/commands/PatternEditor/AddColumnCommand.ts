import { Appl } from "../../App";
import { InstrumentPinPicker } from "../../components/InstrumentPinPicker";
import { PatternPanel } from "../../components/PatternPanel";
import { ICommand, IComponent } from "../../nutz";

export class AddColumnCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const instrumentPinPicker = new InstrumentPinPicker(this.app);

        const result = await this.app.modalDialogContainer.showModal("Select Instrument and Pin", instrumentPinPicker)
        if (!result) {
            return;
        }

        const instrument = this.app.song.instruments[instrumentPinPicker.instrumentIndex];
        this.app.song.createPatternColumn(this.component.patternEditor.pattern, instrument, instrumentPinPicker.type, instrumentPinPicker.parameterName);
    }
}