import { Appl } from "../../App";
import { exportClipboardPattern } from "../../components/PatternEditorHelper";
import { PatternPanel } from "../../components/PatternPanel";
import { ICommand } from "../../nutz";
import { writeClipboardPattern } from "./Clipboard";

export class CopyCommand implements ICommand {
    app: Appl;

    constructor(private component: PatternPanel) {
        this.app = component.app;
    }

    async handle(...args: any[]) {
        const patternEditor = this.component.patternEditor;
        if (!patternEditor.selection) {
            return;
        }

        const start = Math.min(patternEditor.selection.startColumn, patternEditor.selection.endColumn);
        const end = Math.max(patternEditor.selection.startColumn, patternEditor.selection.endColumn);

        const startRow = Math.min(patternEditor.selection.startRow, patternEditor.selection.endRow);
        const endRow = Math.max(patternEditor.selection.startRow, patternEditor.selection.endRow);

        const clipboardObject = exportClipboardPattern(patternEditor.renderColumns, start, end, startRow, endRow);

        await writeClipboardPattern(clipboardObject);
    }
}
