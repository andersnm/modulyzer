import { Appl } from "../../App";
import { SongDocument } from "../../audio/SongDocument";
import { SequencePanel } from "../../components/SequencePanel";
import { ICommand } from "../../nutz";
import { ClipboardSequence, ClipboardSequenceEvent, writeClipboardSequence } from "../PatternEditor/Clipboard";

export function exportClipboardSequence(song: SongDocument, start: number, end: number, startRow: number, endRow: number) {
    const clipboardObject: ClipboardSequence = {
        width: (end - start) + 1,
        height: (endRow - startRow) + 1,
        columns: [],
    };

    for (let i =  start; i <= end; i++) {
        const events = song.sequenceColumns[i].events
            .filter(e => e.time >= startRow && e.time <= endRow)
            .map(e => ({
                time: e.time - startRow,
                patternIndex: song.patterns.indexOf(e.pattern),
            } as ClipboardSequenceEvent)
        );

        clipboardObject.columns.push(events);
    }

    return clipboardObject;
}

export class CopyCommand implements ICommand {
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
        await writeClipboardSequence(clipboardObject);
    }
}
