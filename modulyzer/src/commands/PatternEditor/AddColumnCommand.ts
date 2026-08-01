import { Appl } from "../../App";
import { PatternDocument, SongDocument } from "../../audio/SongDocument";
import { convertPatternToInstrumentColumns, InstrumentColumn, InstrumentPinPicker } from "../../components/InstrumentPinPicker";
import { PatternFrame } from "../../components/PatternFrame";
import { ICommand } from "../../nutz";

function updatePatternColumns(song: SongDocument, pattern: PatternDocument, columns: InstrumentColumn[]) {
    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const patternColumn = pattern.columns.find(c => c.type === column.type && c.parameterName === column.name);
        if (!patternColumn && column.checked) {
            // added
            song.createPatternColumn(pattern, pattern.instrument, column.type, column.name);
            // TODO: need song.movePatternColumn()?
            // TODO: or createPC with index parameter?
            // TODO: can document have any order, but pattern ui/player defines own order?
        } else if (patternColumn && !column.checked) {
            // removed
            song.deletePatternColumn(pattern, patternColumn);
        }
    }
}

export class AddColumnCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const columns = convertPatternToInstrumentColumns(this.app.playerSongAdapter, this.component.pattern.instrument, this.component.pattern.columns);
        const panel = new InstrumentPinPicker(this.app, columns);

        const result = await this.app.modalDialogContainer.showModal("Select Pattern Columns", panel);
        if (!result) {
            return;
        }

        updatePatternColumns(this.app.song, this.component.pattern, panel.columns);
    }
}