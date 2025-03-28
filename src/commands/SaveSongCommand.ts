import { Appl } from "../App";
import { SaveAsPanel } from "../components/SaveAsPanel";
import { IComponent, INotify } from "../nutz";

export class SaveSongCommand implements INotify {
    constructor(private app: Appl) {
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof SaveAsPanel) {
            if (eventName === "ok") {
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                this.app.modalDialogContainer.endModal(false);
            }
        }
    }

    async handle() {

        const savePanel = new SaveAsPanel(this.app, this, this.app.song.name + ".json");

        const result = await this.app.modalDialogContainer.showModal(savePanel);

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
