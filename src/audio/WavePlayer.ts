import { Appl } from "../App";
import { WaveDocument } from "../audio/SongDocument";

/**
 * Standalone thing for playing waves on the current audio device context
 * outside the main song graph. E.g play current selection in the wave editor,
 * or preview in the waves list.
 */
export class WavePlayer extends EventTarget {
    app: Appl;
    node: AudioBufferSourceNode | null = null;
    source: any;

    constructor(app: Appl) {
        super();

        this.app = app;
    }

    async playWave(wave: WaveDocument, source: any) {
        if (this.node) {
            await this.stopWave();
        }

        return new Promise<void>((resolve, reject) => {
            const context = this.app.device.context;
            const playerWave = this.app.playerSongAdapter.waveMap.get(wave);

            const node = context.createBufferSource();
            node.buffer = playerWave.audioBuffer;

            node.addEventListener("ended", () => {
                console.log("end of WavePlayer");
                node.disconnect(context.destination);
                this.node = null;
                resolve();
            });

            this.node = node;
            this.source = source;

            node.connect(context.destination);
            if (wave.selection) {
                const start = Math.min(wave.selection.start, wave.selection.end) / wave.sampleRate;
                const end = Math.max(wave.selection.start, wave.selection.end) / wave.sampleRate;

                const duration = (end - start);
                node.start(0, start, duration);
            } else {
                node.start(0);
            }
        });
    }

    async stopWave() {
        if (!this.node) {
            return;
        }

        const node = this.node;
        return new Promise<void>((resolve) => {
            const onEnded = () => {
                node.removeEventListener("ended", onEnded)
                resolve();
            };

            node.addEventListener("ended", onEnded);
            node.stop();
        });
    }
}
