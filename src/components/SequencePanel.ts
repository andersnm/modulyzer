import { Appl } from "../App";
import { SequenceEditorCanvas } from "./SequenceEditorCanvas";
import { registerSequenceEditorCommands } from "../commands/SequenceEditor/Register";
import { ViewFrame } from "../nutz/ViewFrame";
import { CommandButtonBar, DataTable, Div, HFlex } from "../nutz";

export class SequencePanel extends ViewFrame {
    app: Appl;
    actionButtons: CommandButtonBar;
    sequenceEditor: SequenceEditorCanvas;
    patternList: DataTable;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerSequenceEditorCommands(this);

        this.sequenceEditor = new SequenceEditorCanvas(app);
        this.sequenceEditor.addEventListener("selchange", this.onSelChange);
        this.sequenceEditor.addEventListener("cursormove", this.onCursorMove);

        this.patternList = new DataTable();
        this.patternList.container.classList.add("w-32");
        this.patternList.addColumn("Key", "key")
        this.patternList.addColumn("Pattern", "pattern")

        this.actionButtons = new CommandButtonBar(this, [
            {
                type: "button",
                label: "Cut",
                action: "cut",
            },
            {
                type: "button",
                label: "Copy",
                action: "copy",
            },
            {
                type: "button",
                label: "Paste",
                action: "paste",
            },
            {
                type: "separator",
            },
            {
                type: "button",
                label: "Add Column",
                action: "add-column",
            },
            {
                type: "button",
                label: "Delete Column",
                action: "delete-column",
            }
        ]);

        this.addToolbar(this.actionButtons.getDomNode() as HTMLElement);

        const panel = HFlex([
            Div(this.sequenceEditor.getDomNode(), ["flex-1", "flex"]), 
            Div(this.patternList.getDomNode(), ["w-32", "flex"])], 
            [ "gap-1", "h-full" ]);
        this.setView(panel);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.bindButtons();
        this.app.song.addEventListener("createSequenceColumn", this.onCreateSequenceColumn);
        this.app.song.addEventListener("deleteSequenceColumn", this.onDeleteSequenceColumn);
        this.app.song.addEventListener("createPattern", this.onCreatePattern);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("createSequenceColumn", this.onCreateSequenceColumn);
        this.app.song.removeEventListener("deleteSequenceColumn", this.onDeleteSequenceColumn);
        this.app.song.removeEventListener("createPattern", this.onCreatePattern);
    };

    onCreateSequenceColumn = (ev: CustomEvent) => {
        this.bindButtons();
        this.bindPatterns();
    }

    onDeleteSequenceColumn = (ev: CustomEvent) => {
        this.bindButtons();
    }

    onCreatePattern = (ev: CustomEvent) => {
        this.bindPatterns();
    }

    onSelChange = () => {
        this.bindButtons();
    }

    onCursorMove = () => {
        this.bindPatterns();
    }

    bindButtons() {
        this.setCommandState("cut", { enabled: !!this.sequenceEditor.selection });
        this.setCommandState("copy", { enabled: !!this.sequenceEditor.selection });
        this.setCommandState("paste", { enabled: this.app.song.sequenceColumns.length > 0 });
        this.setCommandState("delete-column", { enabled: this.app.song.sequenceColumns.length > 0 });
    }

    bindPatterns() {
        const sequence = this.app.song.sequenceColumns[this.sequenceEditor.cursorColumn];
        if (!sequence) {
            return;
        }

        while (this.patternList.getRowCount()) this.patternList.removeRow(0);
        let key = 0;
        for (let pattern of sequence.instrument.patterns) {
            this.patternList.addRow({key: key < 10 ? key.toString() : "-", pattern: pattern.name});
            key++;
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
