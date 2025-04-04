import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { registerPatternEditorCommands } from "../commands/PatternEditor/Register";
import { ButtonToolbar, CommandHost, formatHotkey, IComponent } from "../nutz";
import { PatternEditorCanvas } from "./PatternEditorCanvas";

export class PatternPanel extends CommandHost implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    patternEditor: PatternEditorCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerPatternEditorCommands(this)

        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        this.container.tabIndex = 0;

        this.patternEditor = new PatternEditorCanvas(app);

        this.toolbar = ButtonToolbar(this, [
            {
                type: "button",
                label: "Add Column",
                action: "add-column",
            },
            {
                type: "button",
                label: "Edit...",
                action: "edit-pattern",
            }
        ]);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.patternEditor.getDomNode());

        this.container.addEventListener("focus", this.onFocus);
        this.container.addEventListener("keydown", this.onKeyDown);
        this.container.addEventListener("keyup", this.onKeyUp);
    }

    setPattern(pattern: PatternDocument) {
        this.patternEditor.setPattern(pattern);
    }

    getDomNode(): Node {
        return this.container;
    }

    onFocus = () => {
        // this.patternEditor.canvas.focus();
    }

    onKeyDown = (e: KeyboardEvent) => {
        if (this.patternEditor.editKeyDown(e)) {
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

    onKeyUp = (e: KeyboardEvent) => {
        this.patternEditor.editKeyUp(e);
    };
}
