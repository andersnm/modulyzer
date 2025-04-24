import { Appl } from "../../App";
import { CreateWavePanel } from "../../components/CreateWavePanel";
import { WavesPanel } from "../../components/WavesPanel";
import { IComponent, INotify } from "../../nutz";

export class CreateWaveCommand implements INotify {
    app: Appl;

    constructor(private component: WavesPanel) {
        this.app = component.app;
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof CreateWavePanel) {
            if (eventName === "ok") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(false);
            }
        }
    }

    async handle() {
        if (!this.component.instrument) {
            console.log("no instrument")
            return;
        }

        const audioConfiguration = new CreateWavePanel(this);

        const result = await this.app.modalDialogContainer.showModal("Create Wave", audioConfiguration);

        if (result) {
            const channelCount = audioConfiguration.channels;
            const sampleRate = this.app.device?.context.sampleRate ?? 44100;

            const sampleCount = audioConfiguration.duration * sampleRate;
            const buffers: Float32Array[] = [];
            for (let i = 0; i < channelCount; i++) {
                buffers.push(new Float32Array(sampleCount));
            }

            this.app.song.createWave(this.component.instrument, audioConfiguration.name, audioConfiguration.note, sampleCount, sampleRate, buffers);
        }
    }
}