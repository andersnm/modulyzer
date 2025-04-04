import { Appl } from "../../App";
import { InstrumentPinPicker } from "../../components/InstrumentPinPicker";
import { PatternPanel } from "../../components/PatternPanel";
import { ICommand, IComponent, INotify } from "../../nutz";

export class AddColumnCommand implements ICommand, INotify {
    app: Appl;

    constructor(private component: PatternPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const instrumentPinPicker = new InstrumentPinPicker(this.app, this);
        const result = await this.app.modalDialogContainer.showModal("Select Instrument and Pin", instrumentPinPicker)
        if (!result) {
            return;
        }

        const instrument = this.app.song.instruments[instrumentPinPicker.instrumentIndex];
        this.app.song.createPatternColumn(this.component.patternEditor.pattern, instrument, instrumentPinPicker.pinIndex);
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof InstrumentPinPicker) {
            if (eventName === "ok") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(false);
            }
        }
    }
}