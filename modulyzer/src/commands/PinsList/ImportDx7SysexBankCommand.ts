import { ICommand } from "../../nutz";
import { Dx7Patch } from "../../audio/dx7/Dx7Patch";
import { PinsPanel } from "../../components/PinsPanel";
import { convertDx7Bank } from "../../presetfile/Dx7Preset";

export class ImportDx7SysexCommand implements ICommand {
    constructor(private component: PinsPanel) {
    }

    async handle(...args: any[]) {
        const [ openHandle ] = await window.showOpenFilePicker({
            startIn: this.component.app.homeDir,
            types: [
                {
                    accept: {
                        "application/octet-stream": [".syx", ".sysex" ],
                    }
                }
            ],
        });

        const file = await openHandle.getFile();
        const buffer = await file.arrayBuffer();
        const bank = convertDx7Bank(buffer, file.name);

        this.component.setBank(bank);
    }
}
