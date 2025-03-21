import { Appl } from "../App";
import { CreateNewPanel } from "../components/CreateNewPanel";
import { IComponent, INotify } from "../nutz";

export class ShowCreateNewRecordingCommand implements INotify {
    constructor(private app: Appl) {

        // og vi kan ha lokale props - hva slags pattern er dette!
    }

    // onCreateNew = async (panelProps: CreateNewPanelProps) => {
    //     console.log("CREAATE NEW FROM ", panelProps);
    //     // const panelProps = e.detail;

    //     const sampleRate = this.app.device.context.sampleRate; // props.currentInputSampleRate;

    //     const sampleCount = panelProps.durationSec * sampleRate;
    //     const buffers: Float32Array[] = [];
    //     for (let i = 0; i < panelProps.channelCount; i++) {
    //         buffers.push(new Float32Array(sampleCount));
    //     }

    //     const recording = await this.app.storage.createRecording(sampleRate, buffers);
    //     const document = await this.app.storage.createDocument(panelProps.name, sampleRate, buffers.length, sampleCount, recording.id); // , historyPosition: 0, history: [] });
    //     // const documentId = await this.storage.createDocument({ name: panelProps.name, channelCount: buffers.length, sampleRate, sampleCount, recordingId, historyPosition: 0, history: [] });

    //     // this.props.showCreateNewDialog = false;

    //     // refresh recordingspanel! recordings har listener på storage?
    //     // open in tabs ->

    // };

    notify(source: IComponent, eventName: string, ...args: any): void {
        console.log("APP NOTIFY", source, eventName, args)
        if (source instanceof CreateNewPanel) {
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
        console.log("NEW");

        const audioConfiguration = new CreateNewPanel(this);

        const result = await this.app.modalDialogContainer.showModal(audioConfiguration);

        console.log("modal", result)

        if (result) {
            const channelCount = 1;
            const sampleRate = this.app.device?.context.sampleRate ?? 44100;

            const sampleCount = audioConfiguration.duration * sampleRate;
            const buffers: Float32Array[] = [];
            for (let i = 0; i < channelCount; i++) {
                buffers.push(new Float32Array(sampleCount));
            }

            this.app.song.createWave(audioConfiguration.name, sampleCount, sampleRate, buffers);
        }
    }
}