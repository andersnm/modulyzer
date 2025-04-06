import { Appl } from "../../App";
import { ICommand } from "../../nutz";

function formatPatternName(i: number) {
    let name = i.toString(16).toUpperCase();
    while (name.length < 2)
        name = "0" + name;

    return name;
}

export class CreatePatternCommand implements ICommand {
    constructor(private app: Appl) {
    }

    async handle() {
        let counter = 0;
        let name = formatPatternName(counter);
        while (this.patternNameExists(name)) {
            counter++;
            name = formatPatternName(counter)
        }

        this.app.song.createPattern(name, 32, 4);
    }

    patternNameExists(name: string) {
        return this.app.song.patterns.findIndex(p => p.name === name) !== -1;
    }
}