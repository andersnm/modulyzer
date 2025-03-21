import { Appl } from "../App";
// import { ExportView } from "../components/ExportView";

export class ShowExportRecordingCommand {
    constructor(private app: Appl) {
        // og vi kan ha lokale props - hva slags pattern er dette!
    }

    onExport(document) {
        // this.props.showExportDialog = true;
        const blob = document.exportWav(document.recording)
        var a = window.document.createElement("a");
        window.document.body.appendChild(a);
        a.style.display = "none";

        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = "tesst.wav";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    async handle() {
        // TODO; async - await until closed, 
        // now the modal can call resolve too? looks nice?
        // const currentDocument = this.app.waveDocuments[this.app.props.currentMainTab];
        // if (!currentDocument) {
        //     return;
        // }

        // this.app.showModal("Export", (resolve) => [
        //     new ExportView({
        //         format: "16s", // same as document? 32 something + channels, specify explicit channels and bits instead?
        //         name: "default",
        //         save: () => { this.onExport(currentDocument); resolve(); },
        //         close: () => resolve(),
        //     }, currentDocument)
        // ]);
    }
}