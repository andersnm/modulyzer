import { Appl } from "../App";
import { CreateWavePanel } from "../components/CreateWavePanel";
import { IComponent, INotify } from "../nutz";

export class CreateWaveCommand implements INotify {
    constructor(private app: Appl) {
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
        const audioConfiguration = new CreateWavePanel(this);

        const result = await this.app.modalDialogContainer.showModal(audioConfiguration);

        if (result) {
            const channelCount = audioConfiguration.channels;
            const sampleRate = this.app.device?.context.sampleRate ?? 44100;

            const sampleCount = audioConfiguration.duration * sampleRate;
            const buffers: Float32Array[] = [];
            for (let i = 0; i < channelCount; i++) {
                buffers.push(new Float32Array(sampleCount));
            }

            this.app.song.createWave(audioConfiguration.name, audioConfiguration.note, sampleCount, sampleRate, buffers);
        }
    }
}