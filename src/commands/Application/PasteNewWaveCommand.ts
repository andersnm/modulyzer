import { Appl } from "../../App";
import { readClipboardWave } from "../../Clipboard";

export class PasteNewWaveCommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const wavFile = await readClipboardWave();

        if (!wavFile) {
            return;
        }
        
        this.app.song.createWave(wavFile.name || "Clipboard", 60, wavFile.channels[0].length, wavFile.sampleRate, wavFile.channels);

    }
}