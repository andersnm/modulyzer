import { Appl } from "../../App";
import { FileSystemConfiguration } from "../../components/FileSystemConfiguration";
import { IComponent, INotify } from "../../nutz";

export class ShowFileSystemConfigurationCommand implements INotify {
    constructor(private app: Appl) {
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof FileSystemConfiguration) {
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
        const panel = new FileSystemConfiguration(this.app, this, this.app.homeDir);

        const result = await this.app.modalDialogContainer.showModal("Select Home Directory", panel, false);
        if (!result) {
            return;
        }

        this.app.homeDir = panel.homeDir;
        await this.app.writeSetting("HomeHandle", panel.homeDir);
    }
}