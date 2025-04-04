import { Appl } from "../../App";
import { WaveDocumentEx } from "../../audio/SongDocument";
import { WavePanel } from "../../components/WavePanel";

export class PlayWaveCommand {

    constructor(private app: Appl) {
    }

    async handle(wave?: WaveDocumentEx) {

        // TODO: get offset from wave selection, range should be in document
        // TODO: waves list play -> play whole, wave editor -> play selection
        // can have different commands, but shared playback state

        if (!wave) {
            const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Wave");
            if (tabIndex === -1) {
                console.warn("No wave tab")
                return;
            }

            const wavePanel = this.app.mainTabs.tabContent[tabIndex] as WavePanel;
            if (!wavePanel.document) {
                console.warn("Wave tab has no wave")
                return;
            }

            wave = wavePanel.document;
        }

        await this.app.wavePlayer.playWave(wave);
        console.log("end of async play-wave command");
    }
}
