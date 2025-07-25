import { Appl } from "../../App";
import { SaveAsPanel } from "../../components/SaveAsPanel";

export class SaveSongCommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const savePanel = new SaveAsPanel(this.app, this.app.song.name + ".json");

        const result = await this.app.modalDialogContainer.showModal("Save As", savePanel);

        if (!result) {
            return;
        }

        const json = this.app.song.exportProjectJson();
        let blob = new Blob([JSON.stringify(json, null, 1)], {type: "application/json"});

        var a = window.document.createElement("a");
        window.document.body.appendChild(a);
        a.style.display = "none";

        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = savePanel.name;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
