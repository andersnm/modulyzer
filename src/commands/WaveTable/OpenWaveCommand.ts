import { Appl } from "../../App";
import { WavesPanel } from "../../components/WavesPanel";
import { ICommand } from "../../nutz";
import { DrumkitReader } from "../../wavefile/DrumkitReader";
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
        input.accept = ".wav,.drumkit";

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    console.log("QAV", reader.result);
                    this.parseArrayBuffer(file.name, reader.result as ArrayBuffer);
                };
                reader.readAsArrayBuffer(file);
            }
        };

        input.click();
    }

    parseArrayBuffer(name: string, buffer: ArrayBuffer) {
        const view = new DataView(buffer);
        const probe = view.getInt32(0, true);
        // console.log("PROBE:", probe, probe.toString(16))

        if (probe === 0x46464952) { // RIFF
            this.parseWav(name, buffer);
        } else if (probe === 0x44495350) { // PSID
            this.parseDrumkit(name, buffer);
        }
    }

    parseWav(name: string, buffer: ArrayBuffer) {
        const dc = new WAVDecoder();
        const wav = dc.decode(buffer)
        console.log(wav);
        const note = findAvailableNote(this.component.instrument.waves);
        this.app.song.createWave(this.component.instrument, name, note, wav.length, wav.sampleRate, wav.channels);
    }

    parseDrumkit(name: string, buffer: ArrayBuffer) {
        const dc = new DrumkitReader();
        if (!dc.open(buffer)) {
            return ;
        }

        for (let i = 0; i < dc.samples.length; i++) {
            const sample = dc.samples[i];
            if (sample.tamano === 0) continue;
            const note = findAvailableNote(this.component.instrument.waves);
            this.app.song.createWave(this.component.instrument, name, note, sample.tamano, 44100, [ sample.buffer ]);
        }
    }
}