import { Appl } from "../../App";
import { InstrumentFactoryPicker } from "../../components/InstrumentFactoryPicker";
import { MixerPanel } from "../../components/MixerPanel";
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
        const instrument = this.app.song.createInstrument(instrumentId, this.getInstrumentName(instrumentId), clickPt[0], clickPt[1], {});

        // If instrument has notes: Create sequence column and empty pattern with default pattern columns
        const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(instrument);
        if (playerInstrument.factory.maxPolyphony > 0) {
            const column = this.app.song.createSequenceColumn(instrument);
            const pa = this.app.song.createPattern(instrument, "00", 64, 4);
            this.app.song.createPatternColumn(pa, instrument, "midinote");
        }

        // Load default preset bank if exist
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
}
