import { Appl } from "../../App";
import { WaveDocument } from "../../audio/SongDocument";
import { readClipboardWave } from "../../Clipboard";
import { WavesPanel } from "../../components/WavesPanel";

export function findAvailableNote(waves: WaveDocument[]) {
    let note = 48; // 48 = C-3
    let counter = 0;
    while (counter < 100) {
        const wave = waves.find(w => w.note === note);
        if (!wave) {
            return note;
        }

        note++;
    }

    return 1;
}

export class PasteNewWaveCommand {
    app: Appl;

    constructor(private component: WavesPanel) {
        this.app = component.app;
    }

    async handle() {
        if (!this.component.instrument) {
            return;
        }

        const wavFile = await readClipboardWave();

        if (!wavFile) {
            return;
        }

        const note = findAvailableNote(this.component.instrument.waves);
        this.app.song.createWave(this.component.instrument, wavFile.name || "Clipboard", note, wavFile.channels[0].length, wavFile.sampleRate, wavFile.channels);
    }
}