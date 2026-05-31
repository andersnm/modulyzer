import { Appl } from "../App";
import { SequenceEditorCanvas } from "./SequenceEditorCanvas";
import { registerSequenceEditorCommands } from "../commands/SequenceEditor/Register";
import { ViewFrame } from "../nutz/ViewFrame";
import { CommandButtonBar } from "../nutz";

export class SequencePanel extends ViewFrame {
    app: Appl;
    actionButtons: CommandButtonBar;
    sequenceEditor: SequenceEditorCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerSequenceEditorCommands(this);

        this.sequenceEditor = new SequenceEditorCanvas(app);
        this.sequenceEditor.addEventListener("selchange", this.onSelChange);

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
        this.setView(this.sequenceEditor.getDomNode());

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.bindButtons();
        this.app.song.addEventListener("createSequenceColumn", this.onCreateSequenceColumn);
        this.app.song.addEventListener("deleteSequenceColumn", this.onDeleteSequenceColumn);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("createSequenceColumn", this.onCreateSequenceColumn);
        this.app.song.removeEventListener("deleteSequenceColumn", this.onDeleteSequenceColumn);
    };

    onCreateSequenceColumn = (ev: CustomEvent) => {
        this.bindButtons();
    }

    onDeleteSequenceColumn = (ev: CustomEvent) => {
        this.bindButtons();
    }

    onSelChange = () => {
        this.bindButtons();
    }

    bindButtons() {
        this.setCommandState("cut", { enabled: !!this.sequenceEditor.selection });
        this.setCommandState("copy", { enabled: !!this.sequenceEditor.selection });
        this.setCommandState("paste", { enabled: this.app.song.sequenceColumns.length > 0 });
        this.setCommandState("delete-column", { enabled: this.app.song.sequenceColumns.length > 0 });
    }

    getDomNode(): Node {
        return this.container;
    }
}
