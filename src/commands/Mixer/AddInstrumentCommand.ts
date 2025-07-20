import { Appl } from "../../App";
import { Bank, Preset } from "../../audio/SongDocument";
import { InstrumentFactoryPicker } from "../../components/InstrumentFactoryPicker";
import { MixerPanel } from "../../components/MixerPanel";
import { getOrCreateDirectory, ICommand, IComponent, INotify } from "../../nutz";
import { importJsonPreset } from "../../presetfile/JsonPreset";

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
        const instrumentId = factory.getIdentifier();

        const instrument = this.app.song.createInstrument(instrumentId, this.getInstrumentName(instrumentId), 0, 0, {});

        const instrumentName = instrument.instrumentId.replace(/[\/\\:*?"<>|]/g, "_");

        const instrumentPresetHandle = await getOrCreateDirectory(this.component.app.homeDir, "presets", instrumentName)

        const bankHandle = await instrumentPresetHandle.getFileHandle("default.mprs")
        const bank = await importJsonPreset(bankHandle);

        console.log("Createing instrument with bank", bank)
        this.app.song.setInstrumentBank(instrument, bank);
    }

    getInstrumentName(instrumentId: string): string {
        const ls = instrumentId.lastIndexOf("/");

        const baseName = instrumentId.substring(ls + 1);
        let name = baseName;
        let counter = 2;
        while (this.instrumentNameExists(name)) {
            name = baseName + "-" + counter;
            counter++;
        }

        return name;
    }

    instrumentNameExists(name: string) {
        return this.app.song.instruments.findIndex(i => i.name === name) !== -1;
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
