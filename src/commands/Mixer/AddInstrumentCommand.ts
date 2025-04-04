import { Appl } from "../../App";
import { InstrumentFactoryPicker } from "../../components/InstrumentFactoryPicker";
import { MixerPanel } from "../../components/MixerPanel";
import { ICommand, IComponent, INotify } from "../../nutz";

export class AddInstrumentCommand implements ICommand, INotify {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const instrumentFactoryPicker = new InstrumentFactoryPicker(this.app, this);
        const result = await this.app.modalDialogContainer.showModal("Select Instrument", instrumentFactoryPicker)
        if (!result) {
            return;
        }

        const factory = this.app.instrumentFactories[instrumentFactoryPicker.instrumentFactoryIndex];
        const instrument = this.app.song.createInstrument(factory.getIdentifier(), "NewInstrument", 0, 0, {});

    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof InstrumentFactoryPicker) {
            console.log("NOTIFY FROM MODAL")
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
