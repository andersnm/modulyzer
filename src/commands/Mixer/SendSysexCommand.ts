import { Appl } from "../../App";
import { MixerPanel } from "../../components/MixerPanel";
import { ICommand } from "../../nutz";

export class SendSysexCommand implements ICommand {
    app: Appl;

    constructor(private component: MixerPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        const instrument = this.component.mixerCanvas.selectedInstrument;
        if (!instrument) {
            console.log("No instrument selected")
            return;
        }

        const factory = this.app.instrumentFactories.find(i => i.getIdentifier() === instrument.instrumentId);
        if (!factory.useSysex) {
            console.log("Instrument does not support sysex")
            return;
        }

        const types: FilePickerAcceptType[] = [
            {
                description: "Sysex (*.syx, *.sysex)",
                accept: {
                    "application/octet-stream": [".syx", ".sysex"],
                },
            },
        ];

        const [ handle ] = await window.showOpenFilePicker({types});
        const file = await handle.getFile();
        const buffer = await file.arrayBuffer();
        const sysex = new Uint8Array(buffer);

        // make sysex part of document, player adapter uploads and manages the bytes in the instrument
        this.app.song.updateInstrument(instrument, instrument.name, instrument.x, instrument.y, instrument.ccs, sysex);
    }
}
