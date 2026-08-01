import { Appl } from "../../App";
import { deletePatternEvents, editNote, editNoteOff, editValue, editVelocity } from "../../components/PatternEditorHelper";
import { PatternFrame } from "../../components/PatternFrame";
import { PatternPanel } from "../../components/PatternPanel";
import { ICommand } from "../../nutz";
import { readClipboardPattern } from "./Clipboard";

export class PasteCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternFrame) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const patternEditor = this.component.patternView.patternEditor;

        if (!patternEditor.renderColumns) {
            return;
        }

        const clipboardObject = await readClipboardPattern();
        if (!clipboardObject) {
            return;
        }

        console.log("Paste buffer", clipboardObject);

        // Clear the pasted area, use pe apis to manipulate notes/noteoffs
        const startCursorColumn = patternEditor.cursorColumns[patternEditor.cursorColumn];
        const renderIndex = patternEditor.renderColumns.indexOf(startCursorColumn.renderColumn);

        deletePatternEvents(this.app.song, patternEditor.renderColumns, renderIndex, renderIndex + clipboardObject.width - 1, patternEditor.cursorTime, patternEditor.cursorTime + clipboardObject.height - 1);

        for (let i = 0; i < clipboardObject.width; i++) {
            const renderColumn = patternEditor.renderColumns[renderIndex + i];
            const clipboardColumn = clipboardObject.columns[i];

            if (renderColumn.type === "velo") {
                continue;
            }

            const patternColumn = renderColumn.patternColumn;

            for (let e of clipboardColumn.events) {

                if (renderColumn.type === "note") {
                    if (e.data0 !== 0) {
                        const patternEvent = editNote(this.app.song, patternColumn, patternEditor.cursorTime + e.time, renderColumn.channel, e.value);
                        if (patternEvent) {
                            // velo <- data0
                            editVelocity(this.app.song, patternEvent, e.data0);
                        }
                    } else {
                        editNoteOff(this.app.song, patternColumn, patternEditor.cursorTime + e.time, renderColumn.channel);
                    }
                } else {
                    editValue(this.app.song, patternColumn, patternEditor.cursorTime + e.time, renderColumn.channel, e.value);
                }
            }
        }
    }
}