import { Appl } from "../../App";
import { FileSystemConfiguration } from "../../components/FileSystemConfiguration";

export class ShowFileSystemConfigurationCommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const panel = new FileSystemConfiguration(this.app, this.app.homeDir);

        const result = await this.app.modalDialogContainer.showModal("Select Home Directory", panel, false);
        if (!result) {
            return;
        }

        this.app.homeDir = panel.homeDir;
        await this.app.writeSetting("HomeHandle", panel.homeDir);
    }
}