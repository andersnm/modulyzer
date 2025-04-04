import { Appl } from "../../App";
import { WavePanel } from "../../components/WavePanel";
import { WavePropertiesPanel } from "../../components/WavePropertiesPanel";
import { ICommand, IComponent, INotify } from "../../nutz";

export class EditWaveCommand implements ICommand, INotify {
    app: Appl;

    constructor(private component: WavePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {

        if (!this.component.document) {
            console.error("Not editing wave");
            return;
        }

        const wavePanel = new WavePropertiesPanel(this.app, this, this.component.document.name, this.component.document.note);
        const result = await this.app.modalDialogContainer.showModal("Wave Properties", wavePanel);

        if (!result) {
            return;
        }

        this.app.song.updateWave(this.component.document, wavePanel.name, wavePanel.note, this.component.document.selection, this.component.document.zoom);
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof WavePropertiesPanel) {
            if (eventName === "ok") {
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                this.app.modalDialogContainer.endModal(false);
            }
        }
    }
}
