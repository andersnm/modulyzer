import { Appl } from "../../App";
import { WavesPanel } from "../../components/WavesPanel";
import { ICommand } from "../../nutz";
import { WAVDecoder } from "../../wavefile/WAVDecoder";
import { findAvailableNote } from "./PasteNewWaveCommand";

export class OpenWaveCommand implements ICommand {
    app: Appl;

    constructor(private component: WavesPanel) {
        this.app = component.app;
    }

    async handle() {
        if (!this.component.instrument) {
            return;
        }

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".wav";

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    console.log("QAV", reader.result);
                    const dc = new WAVDecoder();
                    const wav = dc.decode(reader.result as ArrayBuffer)
                    console.log(wav);
                    const note = findAvailableNote(this.component.instrument.waves);
                    this.app.song.createWave(this.component.instrument, file.name, note, wav.length, wav.sampleRate, wav.channels);
                };
                reader.readAsArrayBuffer(file);
            }
        };

        input.click();
    }
}