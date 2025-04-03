import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { registerPatternEditorCommands } from "../commands/PatternEditor/Register";
import { ButtonToolbar, CommandHost, formatHotkey, IComponent } from "../nutz";
import { InstrumentPinPicker } from "./InstrumentPinPicker";
import { PatternEditorCanvas } from "./PatternEditorCanvas";

export class PatternPanel extends CommandHost implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    patternEditor: PatternEditorCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        this.container.tabIndex = 0;

        this.patternEditor = new PatternEditorCanvas(app);

        this.toolbar = ButtonToolbar([
            {
                type: "button",
                label: "Add Column",
                icon: "",
                click: () => {
                    this.executeCommand("add-column");
                },
            }
        ]);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.patternEditor.getDomNode());

        this.container.addEventListener("focus", this.onFocus);
        this.container.addEventListener("keydown", this.onKeyDown);
        this.container.addEventListener("keyup", this.onKeyUp);

        registerPatternEditorCommands(this)
    }

    setPattern(pattern: PatternDocument) {
        this.patternEditor.setPattern(pattern);
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof InstrumentPinPicker) {
            console.log("NOTIFY FROM MODAL")
            if (eventName === "ok") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(false);
            }
        }
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
