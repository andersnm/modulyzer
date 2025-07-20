import { PinsPanel } from "../../components/PinsPanel";
import { getOrCreateDirectory, ICommand } from "../../nutz";
import { importJsonPreset } from "../../presetfile/JsonPreset";

export class ImportLocalBankCommand implements ICommand {
    constructor(private component: PinsPanel) {
    }

    async handle(...args: any[]) {

        // Get or create /presets/<instrument-uri> directory
        const instrumentName = this.component.instrument.instrumentId.replace(/[\/\\:*?"<>|]/g, "_");

        const instrumentPresetHandle = await getOrCreateDirectory(this.component.app.homeDir, "presets", instrumentName)

        const [ openHandle ] = await window.showOpenFilePicker({
            startIn: instrumentPresetHandle,
            types: [
                {
                    accept: {
                        "application/json": [".mprs" ],
                    }
                }
            ],
        });

        const bank = await importJsonPreset(openHandle);
        this.component.setBank(bank);
    }
}
