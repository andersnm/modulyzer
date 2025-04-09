import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { registerPatternEditorCommands } from "../commands/PatternEditor/Register";
import { ButtonToolbar, CommandHost, formatHotkey, IComponent, StatusBar } from "../nutz";
import { PatternEditorCanvas } from "./PatternEditorCanvas";
import { formatNote, getCursorColumnAt, getPatternRenderColumns } from "./PatternEditorHelper";

export class PatternPanel extends CommandHost implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    patternEditor: PatternEditorCanvas;
    statusBar: StatusBar;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerPatternEditorCommands(this)

        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        this.container.tabIndex = 0;

        this.patternEditor = new PatternEditorCanvas(app, this);

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

        this.statusBar = new StatusBar();
        this.statusBar.addPart(["w-48"], "Row: 0, Track: 0")
        this.statusBar.addPart(["w-48", "border-l-2", "pl-2", "border-neutral-500"], "Value")
        this.statusBar.addPart(["flex-1", "border-l-2", "pl-2", "border-neutral-500"], "Parameter description")

        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.patternEditor.getDomNode());
        this.container.appendChild(this.statusBar.getDomNode());

        this.container.addEventListener("focus", this.onFocus);
        this.container.addEventListener("keydown", this.onKeyDown);
        this.container.addEventListener("keyup", this.onKeyUp);
    }

    setPattern(pattern: PatternDocument) {
        this.patternEditor.setPattern(pattern);
        this.patternEditor.moveCursor(0, 0);
        this.updateStatusBar();
    }

    getDomNode(): Node {
        return this.container;
    }

    onFocus = () => {
        // this.patternEditor.canvas.focus();
    }

    onKeyDown = (e: KeyboardEvent) => {
        if (this.patternEditor.editKeyDown(e)) {
            this.updateStatusBar();
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

    updateStatusBar() {

        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.patternEditor.pattern, 8);
        const cursorColumn = getCursorColumnAt(renderColumns, this.patternEditor.cursorColumn);
        if (!cursorColumn) {
            this.statusBar.setText(0, "Row: 0");
            this.statusBar.setText(1, "");
            this.statusBar.setText(2, "");
            return;
        }

        const patternColumn = cursorColumn.renderColumn.patternColumn;

        const instrument = cursorColumn.renderColumn.patternColumn.instrument;
        const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(instrument);
        const pins = playerInstrument.factory.getPins();
        const pin = pins[cursorColumn.renderColumn.patternColumn.pin];

        if (cursorColumn.renderColumn.type === "note" || cursorColumn.renderColumn.type === "velo") {
            this.statusBar.setText(0, "Row: " + this.patternEditor.cursorTime + ", Track: " + cursorColumn.channel)

            const events = patternColumn.events.filter(e => e.time === this.patternEditor.cursorTime && e.channel === cursorColumn.channel);

            const noteEvent = events.find(e => e.data0 !== 0);
            const noteoffEvent = events.find(e => e.data0 === 0);

            if (noteEvent && noteoffEvent) {
                this.statusBar.setText(1, "(multiple - TODO)");
            } else if (noteEvent) {
                this.statusBar.setText(1, formatNote(noteEvent.value) + ", Velo: " + noteEvent.data0.toString(16).toUpperCase() + " (" + noteEvent.data0 + ")");
            } else if (noteoffEvent) {
                this.statusBar.setText(1, formatNote(noteoffEvent.value) + " Off");
            } else {
                this.statusBar.setText(1, "---");
            }
        } else {
            this.statusBar.setText(0, "Row: " + this.patternEditor.cursorTime)
            const event = patternColumn.events.find(e => e.time === this.patternEditor.cursorTime && e.channel === cursorColumn.channel);

            if (event) {
                this.statusBar.setText(1, event.value.toString(16).toUpperCase() + " (" + event.value + ") " + playerInstrument.factory.describeCcValue(pin.value, event.value));
            } else {
                this.statusBar.setText(1, "---");
            }
        }

        this.statusBar.setText(2, pin.name);
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (eventName === "cursormove") {
            this.updateStatusBar();
        }
    }
}
