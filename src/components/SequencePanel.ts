import { Appl } from "../App";
import { SequenceEditorCanvas } from "./SequenceEditorCanvas";
import { ButtonToolbar, CommandHost, formatHotkey, IComponent } from "../nutz";
import { registerSequenceEditorCommands } from "../commands/SequenceEditor/Register";

export class SequencePanel extends CommandHost implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    sequenceEditor: SequenceEditorCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerSequenceEditorCommands(this);

        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        this.container.tabIndex = 0;

        this.sequenceEditor = new SequenceEditorCanvas(app);

        this.toolbar = ButtonToolbar(this, [
            {
                type: "button",
                label: "Add Column",
                action: "add-column",
            }
        ]);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.sequenceEditor.getDomNode());

        this.container.addEventListener("keydown", this.onKeyDown);
    }

    getDomNode(): Node {
        return this.container;
    }

    onKeyDown = (e: KeyboardEvent) => {
        if (this.sequenceEditor.editKeyDown(e)) {
            e.stopPropagation(); // dont run global handler
            e.preventDefault(); // dont do canvas default
            return;
        }

        const keyName = formatHotkey(e);
        const hotkeyCommand = this.hotkeys[keyName];
        // console.log(keyName)
        if (hotkeyCommand) {
            this.executeCommand(hotkeyCommand);
            e.stopPropagation();
            e.preventDefault();
        }
    };
}
