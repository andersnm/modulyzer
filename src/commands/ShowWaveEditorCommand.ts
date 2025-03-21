import { Appl } from "../App";
import { WaveDocumentEx } from "../audio/SongDocument";
import { RecordingPanel } from "../components/RecordingPanel";

export class ShowWaveEditorCommand {
    constructor(private app: Appl) {
    }

    async handle(wave?: WaveDocumentEx) {

        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Wave");
        if (tabIndex !== -1) {
            this.app.mainTabs.setCurrentTab(tabIndex);

            if (wave) {
                const pq = this.app.mainTabs.tabContent[tabIndex] as RecordingPanel;
                pq.setWave(wave);
            }

            return;
        }

        const pq = new RecordingPanel(this.app);
        if (wave) {
            pq.setWave(wave);
        } else if (this.app.song.waves[0]) {
            pq.setWave(this.app.song.waves[0]);
        } else {
            const dummy = new WaveDocumentEx();
            pq.setWave(dummy);
        }

        this.app.mainTabs.addTab("Pattern", pq);

        this.app.mainTabs.setCurrentTab(this.app.mainTabs.tabs.tabs.length - 1);
    }
}