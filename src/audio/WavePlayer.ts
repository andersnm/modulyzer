import { Appl } from "../App";
import { Wave } from "../audio/Player";
import { WaveDocumentEx } from "../audio/SongDocument";
import { WavePanel } from "../components/WavePanel";

/**
 * Standalone thing for playing waves on the current audio device context
 * outside the main song graph. E.g play current selection in the wave editor,
 * or preview in the waves list.
 */
export class WavePlayer extends EventTarget {
    app: Appl;
    nodes: AudioBufferSourceNode[] = [];

    constructor(app: Appl) {
        super();

        this.app = app;
    }

    playWave(wave: WaveDocumentEx) {
        this.stopWave();

        return new Promise<void>((resolve, reject) => {
            const context = this.app.device.context;
            const playerWave = this.app.playerSongAdapter.waveMap.get(wave);

            const node = context.createBufferSource();
            node.buffer = playerWave.audioBuffer;

            node.addEventListener("ended", () => {
                console.log("end of WavePlayer");
                node.disconnect(context.destination);
                const index = this.nodes.indexOf(node);
                this.nodes.splice(index, 1);
                resolve();
            });

            this.nodes.push(node);

            node.connect(context.destination);
            node.start(0);
        });
    }

    stopWave() {
        for (let node of this.nodes) {
            node.stop();
        }
    }
}
