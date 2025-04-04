import { Appl } from "../../App";
import { ICommand } from "../../nutz";

export class OpenSongCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = (event: Event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const json = JSON.parse(reader.result as string);
                    this.app.song.importProjectJson(json);
                    // callback(reader.result);
                };
                reader.readAsText(file);
            }
        };

        input.click();

    }
}
