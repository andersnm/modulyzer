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
            }
        ]);

        this.addToolbar(this.actionButtons.getDomNode() as HTMLElement);
        this.setView(this.sequenceEditor.getDomNode());

        this.bindButtons();
    }

    onSelChange = () => {
        this.bindButtons();
    }

    bindButtons() {
        this.actionButtons.setCommandEnabled("cut", !!this.sequenceEditor.selection);
        this.actionButtons.setCommandEnabled("copy", !!this.sequenceEditor.selection);
    }

    getDomNode(): Node {
        return this.container;
    }
}
