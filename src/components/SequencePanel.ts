import { Appl } from "../App";
import { SequenceEditorCanvas } from "./SequenceEditorCanvas";
import { registerSequenceEditorCommands } from "../commands/SequenceEditor/Register";
import { ViewFrame } from "../nutz/ViewFrame";

export class SequencePanel extends ViewFrame {
    app: Appl;
    toolbar: HTMLElement;
    sequenceEditor: SequenceEditorCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerSequenceEditorCommands(this);

        this.sequenceEditor = new SequenceEditorCanvas(app);

        this.setToolbar([
            {
                type: "button",
                label: "Add Column",
                action: "add-column",
            }
        ]);

        this.setView(this.sequenceEditor.getDomNode());
    }

    getDomNode(): Node {
        return this.container;
    }
}
