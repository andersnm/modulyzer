import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { registerPatternEditorCommands } from "../commands/PatternEditor/Register";
import { patternMenu } from "../menu/menu";
import { CommandButtonBar, IComponent, StatusBar } from "../nutz";
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
    actionButtons: CommandButtonBar;
    patternEditor: PatternEditorCanvas;
    octaveInput: OctaveInput;
    statusBar: StatusBar;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerPatternEditorCommands(this)

        this.patternEditor = new PatternEditorCanvas(app);
        this.patternEditor.addEventListener("cursormove", this.onCursorMove);
        this.patternEditor.addEventListener("selchange", this.onSelChange);
        this.patternEditor.canvas.addEventListener("contextmenu", this.onContextMenu);

        this.octaveInput = new OctaveInput(this);
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
                label: "Add Column...",
                action: "add-column",
            },
            {
                type: "button",
                label: "Properties...",
                action: "edit-pattern",
            },
            {
                type: "button",
                label: "Duplicate",
                action: "duplicate-pattern",
            },
        ]);

        this.addToolbar(this.actionButtons.getDomNode() as HTMLElement);
        this.addToolbar(this.octaveInput.getDomNode() as HTMLElement);

        this.setView(this.patternEditor.getDomNode() as HTMLElement);

        this.statusBar = new StatusBar();
        this.statusBar.addPart(["w-48"], "Row: 0, Track: 0")
        this.statusBar.addPart(["w-48"], "Value")
        this.statusBar.addPart(["flex-1"], "Parameter description")
        this.statusBar.addPart(["w-36"], "--")

        // NOTE: Adding statusbar in ViewFrame's container
        this.container.appendChild(this.statusBar.getDomNode());

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);

        this.bindButtons();
    }


    onMounted = () => {
        this.app.song.addEventListener("deletePattern", this.onDeletePattern);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("deletePattern", this.onDeletePattern);
    };

    onDeletePattern = (ev: CustomEvent<PatternDocument>) => {
        if (ev.detail === this.patternEditor.pattern) {
            this.setPattern(null);
        }
    };

    onCursorMove = () => {
        this.updateStatusBar();
    }

    onSelChange = () => {
        this.bindButtons();
    }

    onContextMenu = (e: MouseEvent) => {
        const rc = this.patternEditor.canvas.getBoundingClientRect();

        this.app.contextMenuContainer.show(this, rc.left + e.offsetX, rc.top + e.offsetY, patternMenu);
        e.preventDefault();
    };

    setPattern(pattern: PatternDocument) {
        this.patternEditor.setPattern(pattern);
        if (pattern) this.patternEditor.moveCursor(0, 0);
        this.updateStatusBar();
        this.bindButtons();
    }

    getDomNode(): Node {
        return this.container;
    }

    updateStatusBar() {

        if (!this.patternEditor.pattern) {
            this.statusBar.setText(0, "Row: 0");
            this.statusBar.setText(1, "");
            this.statusBar.setText(2, "");
            this.statusBar.setText(3, "--");
            return;
        }

        this.statusBar.setText(3, this.patternEditor.pattern.name);

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
                const parameter = this.app.playerSongAdapter.getParameter(instrument, patternColumn.parameterName);
                const description = parameter.describeValue(event.value);
                this.statusBar.setText(1, event.value.toString(16).toUpperCase() + " (" + event.value + ") ") + description;
            } else {
                this.statusBar.setText(1, "---");
            }
        }

        this.statusBar.setText(2, patternColumn.parameterName);
    }

    bindButtons() {
        this.actionButtons.setCommandEnabled("paste", !!this.patternEditor.pattern);
        this.actionButtons.setCommandEnabled("add-column", !!this.patternEditor.pattern);
        this.actionButtons.setCommandEnabled("edit-pattern", !!this.patternEditor.pattern);
        this.actionButtons.setCommandEnabled("duplicate-pattern", !!this.patternEditor.pattern);
        this.actionButtons.setCommandEnabled("cut", this.patternEditor.pattern && !!this.patternEditor.selection);
        this.actionButtons.setCommandEnabled("copy", this.patternEditor.pattern && !!this.patternEditor.selection);
    }
}
