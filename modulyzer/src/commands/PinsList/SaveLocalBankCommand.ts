import { PinsPanel } from "../../components/PinsPanel";
import { getOrCreateDirectory, ICommand } from "../../nutz";
import { saveJsonPreset } from "../../presetfile/JsonPreset";

export class SaveLocalBankCommand implements ICommand {
    constructor(private component: PinsPanel) {
    }

    async handle(...args: any[]) {

        // Get or create /presets/<instrument-uri> directory
        const instrumentName = this.component.instrument.instrumentId.replace(/[\/\\:*?"<>|]/g, "_");

        const instrumentPresetHandle = await getOrCreateDirectory(this.component.app.homeDir, "presets", instrumentName)

        const saveHandle = await window.showSaveFilePicker({
            startIn: instrumentPresetHandle,
            types: [
                {
                    accept: {
                        "application/json": [".mprs" ],
                    }
                }
            ],
            suggestedName: this.component.instrument.bank.name,
        });

        await saveJsonPreset(saveHandle, this.component.instrument.bank);
    }
}
