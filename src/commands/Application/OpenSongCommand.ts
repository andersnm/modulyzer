import { Appl } from "../../App";
import { ICommand } from "../../nutz";

export class OpenSongCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const [ openHandle ] = await window.showOpenFilePicker({
            startIn: this.app.projectFile ?? this.app.homeDir,
            types: [
                {
                    accept: {
                        "application/json": [".json" ],
                    }
                }
            ],
        });

        const songFile = await openHandle.getFile();
        const buffer = await songFile.text();
        const json = JSON.parse(buffer);
        this.app.song.importProjectJson(json);

        this.app.projectFile = openHandle;
    }
}
