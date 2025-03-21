import { Appl } from "../App";
import { RecordingPanel } from "../components/RecordingPanel";

export class RecordWaveCommand {
    // recording: boolean = false;

    constructor(private app: Appl) {
    }

    async handle() {
        // if (this.recording) {
        //     return;
        // }

        const tabIndex = this.app.mainTabs.tabs.tabs.findIndex(t => t.label === "Wave");
        if (tabIndex === -1) {
            console.warn("No wave tab")
            return;
        }

        const wavePanel = this.app.mainTabs.tabContent[tabIndex] as RecordingPanel;
        if (!wavePanel.document) {
            console.warn("Wave tab has no wave")
            return;
        }

        this.app.startRecordWave(wavePanel.document);
    }
}
