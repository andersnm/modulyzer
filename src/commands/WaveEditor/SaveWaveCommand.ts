import { WavePanel } from "../../components/WavePanel";
import { ICommand } from "../../nutz";
import { WAVEncoder, WAVFormat } from "../../wavefile/WAVEncoder";

export class SaveWaveCommand implements ICommand {
    constructor(private component: WavePanel) {
    }

    async handle(...args: any[]) {
        const wave = this.component.document;

        const enc = new WAVEncoder();
        const wav = enc.encode(wave.name, wave.sampleRate, WAVFormat.Int32, wave.buffers )
        let blob = new Blob([wav], {type: "application/wav"});

        var a = window.document.createElement("a");
        window.document.body.appendChild(a);
        a.style.display = "none";

        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = "test.wav";
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
