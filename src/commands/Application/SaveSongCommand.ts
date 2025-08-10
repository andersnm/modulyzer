import { Appl } from "../../App";

export class SaveSongCommand {
    constructor(private app: Appl) {
    }

    async handle() {

        const saveHandle = await window.showSaveFilePicker({
            startIn: this.app.projectFile ?? this.app.homeDir,
            types: [
                {
                    accept: {
                        "application/json": [".json" ],
                    }
                }
            ],
            suggestedName: this.app.projectFile?.name ?? this.app.song.name,
        });

        const json = this.app.song.exportProjectJson();
        const presetsFile = await saveHandle.createWritable({keepExistingData: false});
        await presetsFile.write(JSON.stringify(json, null, " "));
        await presetsFile.close();

        this.app.projectFile = saveHandle;
    }
}
