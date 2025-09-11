import { Appl } from "../../App";
import { InstrumentFactoryPicker } from "../../components/InstrumentFactoryPicker";
import { MixerPanel } from "../../components/MixerPanel";
import { getInstrumentName } from "../../components/PatternEditorHelper";
import { getOrCreateDirectory, ICommand } from "../../nutz";
import { importJsonPreset } from "../../presetfile/JsonPreset";

export class AddInstrumentCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const instrumentFactoryPicker = new InstrumentFactoryPicker(this.app);
        const result = await this.app.modalDialogContainer.showModal("Select Instrument", instrumentFactoryPicker)
        if (!result) {
            return;
        }

        const factory = this.app.instrumentFactories[instrumentFactoryPicker.instrumentFactoryIndex];
        const instrumentId = factory.identifier;

        const clickPt = this.component.mixerCanvas.clickPt;
        const instrument = this.app.createInstrument(instrumentId, clickPt[0], clickPt[1]);
    }
}
