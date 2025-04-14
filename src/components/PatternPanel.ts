import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { registerPatternEditorCommands } from "../commands/PatternEditor/Register";
import { ButtonToolbar, IComponent, StatusBar } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { PatternEditorCanvas } from "./PatternEditorCanvas";
import { formatNote, getCursorColumnAt, getPatternRenderColumns } from "./PatternEditorHelper";

class OctaveInput implements IComponent {

    patternPanel: PatternPanel;
    container: HTMLDivElement;
    input: HTMLInputElement;

    constructor(patternPanel: PatternPanel) {
        this.patternPanel = patternPanel;
        this.container = document.createElement("div");
        this.container.classList.add("flex", "gap-1", "items-center");

        const upHotkey = patternPanel.getHotkeyForCommand("octave-up");
        const downHotkey = patternPanel.getHotkeyForCommand("octave-down");
        const tooltip = "Current octave (" + upHotkey + "/" + downHotkey + ")"

        const label = document.createElement("span");
        label.classList.add("text-white");
        label.title = tooltip;
        label.innerText = "Octave:";

        this.input = document.createElement("input");
        this.input.type = "number";
        this.input.min = "1";
        this.input.max = "7";
        this.input.valueAsNumber = this.patternPanel.patternEditor.octave;
        this.input.title = tooltip;
        this.input.classList.add("rounded-lg", "p-1", "bg-neutral-600", "text-white", "text-center");

        this.input.addEventListener("change", () => {
            const i = parseInt(this.input.value);
            if (!isNaN(i)) {
                this.patternPanel.patternEditor.octave = i;
            }
        })

        this.container.appendChild(label);
        this.container.appendChild(this.input);
    }

    getDomNode(): Node {
        return this.container;
    }
}

export class PatternPanel extends ViewFrame implements IComponent {
    app: Appl;
    patternEditor: PatternEditorCanvas;
    octaveInput: OctaveInput;
    statusBar: StatusBar;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerPatternEditorCommands(this)

        this.patternEditor = new PatternEditorCanvas(app, this);
        this.octaveInput = new OctaveInput(this);

        this.addToolbar(ButtonToolbar(this, [
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
        ]));

        this.addToolbar(this.octaveInput.getDomNode() as HTMLElement);

        this.setView(this.patternEditor.getDomNode() as HTMLElement);

        this.statusBar = new StatusBar();
        this.statusBar.addPart(["w-48"], "Row: 0, Track: 0")
        this.statusBar.addPart(["w-48", "border-l-2", "pl-2", "border-neutral-500"], "Value")
        this.statusBar.addPart(["flex-1", "border-l-2", "pl-2", "border-neutral-500"], "Parameter description")

        // NOTE: Adding statusbar in ViewFrame's container
        this.container.appendChild(this.statusBar.getDomNode());
    }

    setPattern(pattern: PatternDocument) {
        this.patternEditor.setPattern(pattern);
        this.patternEditor.moveCursor(0, 0);
        this.updateStatusBar();
    }

    getDomNode(): Node {
        return this.container;
    }

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
