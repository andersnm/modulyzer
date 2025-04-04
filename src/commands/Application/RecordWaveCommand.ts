import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";

export class RecordWaveCommand {
    constructor(private app: Appl) {
    }

    async handle() {
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

        const offset = wavePanel.waveEditor.selection?.start ?? 0;
        this.app.startRecordWave(wavePanel.document, offset);
    }
}
