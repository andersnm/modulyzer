import { Appl } from "../../App";
import { WAVDecoder } from "../../wavefile/WAVDecoder";

export class OpenWaveCommand {
    constructor(private app: Appl) {
    }

    async handle() {
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
                    this.app.song.createWave(file.name, 60, wav.length, wav.sampleRate, wav.channels);
                };
                reader.readAsArrayBuffer(file);
            }
        };

        input.click();
    }
}