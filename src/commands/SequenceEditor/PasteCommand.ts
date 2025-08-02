import { Appl } from "../../App";
import { SongDocument } from "../../audio/SongDocument";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";
import { ClipboardSequence, ClipboardSequenceEvent, readClipboardSequence, writeClipboardSequence } from "../PatternEditor/Clipboard";
import { exportClipboardSequence } from "./CopyCommand";
import { deleteSequenceEvents } from "./CutCommand";

export class PasteCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const sequenceEditor = this.component.sequenceEditor;

        const clipboardObject = await readClipboardSequence();
        if (!clipboardObject) {
            return;
        }

        const startColumn = sequenceEditor.cursorColumn;
        const endColumn = startColumn + clipboardObject.width - 1;
        const startRow = sequenceEditor.cursorTime;
        const endRow = startRow + clipboardObject.height - 1;

        deleteSequenceEvents(this.app.song, startColumn, endColumn, startRow, endRow);

        for (let i = 0; i < clipboardObject.width; i++) {

            const events = clipboardObject.columns[i];
            const sequenceColumn = this.app.song.sequenceColumns[startColumn + i];
            if (!events || !sequenceColumn) {
                break;
            }

            for (let e of events) {
                const pattern = sequenceColumn.instrument.patterns[e.patternIndex];
                if (!pattern) {
                    continue;
                }

                this.app.song.createSequenceEvent(sequenceColumn, startRow + e.time, pattern);
            }
        }
    }
}
