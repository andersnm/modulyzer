import { Appl } from "../../App";
import { SongDocument } from "../../audio/SongDocument";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";
import { ClipboardSequence, ClipboardSequenceEvent, writeClipboardSequence } from "../PatternEditor/Clipboard";
import { exportClipboardSequence } from "./CopyCommand";

export function deleteSequenceEvents(song: SongDocument, start: number, end: number, startRow: number, endRow: number) {

    for (let i =  start; i <= end; i++) {
        const sequenceColumn = song.sequenceColumns[i];

        for (let j = startRow; j <= endRow; j++) {
            const sequenceEvent = sequenceColumn.events.find(e => e.time === j);
            if (!sequenceEvent) {
                continue;
            }

            song.deleteSequenceEvent(sequenceColumn, sequenceEvent);
        }
    }
}

export class CutCommand implements ICommand {
    app: Appl;

    constructor(private component: SequencePanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const sequenceEditor = this.component.sequenceEditor;
        if (!sequenceEditor.selection) {
            return;
        }

        const start = Math.min(sequenceEditor.selection.startColumn, sequenceEditor.selection.endColumn);
        const end = Math.max(sequenceEditor.selection.startColumn, sequenceEditor.selection.endColumn);

        const startRow = Math.min(sequenceEditor.selection.startRow, sequenceEditor.selection.endRow);
        const endRow = Math.max(sequenceEditor.selection.startRow, sequenceEditor.selection.endRow);

        const clipboardObject = exportClipboardSequence(this.app.song, start, end, startRow, endRow);
        console.log(clipboardObject);

        deleteSequenceEvents(this.app.song, start, end, startRow, endRow);
        await writeClipboardSequence(clipboardObject);
    }
}
