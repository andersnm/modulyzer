import { IComponent } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { Appl } from "../App";
import { InstrumentDocument, PatternDocument } from "../audio/SongDocument";
import { CursorColumnInfo, formatNote, formatU8, getCursorColumnAt, getCursorColumnAtPosition, getCursorColumnIndex, getCursorColumns, getPatternRenderColumns, getRenderColumnWidth } from "./PatternEditorHelper";

const maxPolyphonic = 8;

export class PatternEditorCanvas implements IComponent {
    app: Appl;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    cursorColumn: number = 0;
    cursorTime: number = 0;
    pattern: PatternDocument;
    scrollRow: number = 0;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex-1 w-full pb-1";
        
        this.canvas = FlexCanvas();
        this.canvas.classList.add("rounded-lg");
        // this.canvas.tabIndex = 0;

        this.canvas.addEventListener("pointerdown", this.onMouseDown);
        this.canvas.addEventListener("pointerup", this.onMouseUp);
        this.canvas.addEventListener("pointermove", this.onMouseMove);
        this.canvas.addEventListener("contextmenu", this.onContextMenu);

        this.canvas.addEventListener("resize", this.onResize);
        // this.canvas.addEventListener("keydown", this.onKeyDown);
        // this.canvas.addEventListener("keyup", this.onKeyUp);
        
        this.container.appendChild(this.canvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.app.song.addEventListener("updateInstrument", this.onResize);
        this.app.song.addEventListener("updatePattern", this.onResize);
        this.app.song.addEventListener("createPatternColumn", this.onResize);
        this.app.song.addEventListener("updatePatternColumn", this.onResize);
        this.app.song.addEventListener("createPatternEvent", this.onResize);
        this.app.song.addEventListener("updatePatternEvent", this.onResize);
        this.app.song.addEventListener("deletePatternEvent", this.onResize);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("updateInstrument", this.onResize);
        this.app.song.removeEventListener("updatePattern", this.onResize);
        this.app.song.removeEventListener("createPatternColumn", this.onResize);
        this.app.song.removeEventListener("updatePatternColumn", this.onResize);
        this.app.song.removeEventListener("createPatternEvent", this.onResize);
        this.app.song.removeEventListener("updatePatternEvent", this.onResize);
        this.app.song.removeEventListener("deletePatternEvent", this.onResize);
    };

    onResize = () => {
        this.redrawCanvas();
    };

    onMouseDown = (e: MouseEvent) => {

        const ctx = this.canvas.getContext("2d");
        ctx.font = "14px monospace";
        const em = ctx.measureText("M");

        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const fontHeight = em.fontBoundingBoxAscent + em.fontBoundingBoxDescent; // emHeightAscent 16;

        const c = Math.floor(e.offsetX / em.width);

        const cursorColumn = getCursorColumnAtPosition(renderColumns, c);
        if (!cursorColumn) {
            return;
        }

        this.cursorColumn = getCursorColumnIndex(renderColumns, cursorColumn); //.position; // index!
        this.cursorTime = Math.floor(e.offsetY / fontHeight) - 1 + this.scrollRow;

        this.redrawCanvas();
    };

    onMouseUp = (e: MouseEvent) => {
    };

    onMouseMove = (e: MouseEvent) => {
    };

    onContextMenu = (e: MouseEvent) => {
        console.log("onContextMenu")
        e.preventDefault();
    };

    editKeyDown(e: KeyboardEvent) {
        switch (e.key) {
            case "ArrowUp":
                this.moveCursor(0, -1);
                return true;
            case "ArrowDown":
                this.moveCursor(0, 1);
                return true;
            case "ArrowLeft":
                this.moveCursor(-1, 0);
                return true;
            case "ArrowRight":
                this.moveCursor(1, 0);
                return true;
            case "Delete":
                this.deleteAtCursor();
                return true;
            case "Tab":
                if (e.shiftKey) {
                    this.movePreviousColumn();
                } else {
                    this.moveNextColumn();
                }
                return true;
            case "Home":
                this.moveHome();
                return true;
            case "End":
                this.moveEnd();
                return true;
            case "PageUp":
                this.moveCursor(0, -16);
                return true;
            case "PageDown":
                this.moveCursor(0, 16);
                return true;
            default:
                console.log(e);
                break;
        }

        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        if (renderColumns.length === 0) return;
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        if (cursorColumn.type === "u4-basenote") {
            return this.editNoteKeyDown(e, cursorColumn);
        } else {
            return this.editNumberKeyDown(e);
        }

        return false;
    }

    editKeyUp(e: KeyboardEvent) {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        if (renderColumns.length === 0) return;

        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        if (cursorColumn.type === "u4-basenote") {
            this.editNoteKeyUp(e, cursorColumn);
        }
    };

    moveCursor(dx, dy) {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumns = getCursorColumns(renderColumns);

        this.cursorTime = Math.max(Math.min(this.cursorTime + dy, this.pattern.duration - 1), 0);
        this.cursorColumn = Math.max(Math.min(this.cursorColumn + dx, cursorColumns.length - 1), 0);
        
        this.scrollIntoView();
        this.redrawCanvas();
    }

    moveNextColumn() {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumns = getCursorColumns(renderColumns);
        const ccc = cursorColumns[this.cursorColumn];

        for (let i = this.cursorColumn + 1; i < cursorColumns.length; i++) {
            const cc = cursorColumns[i];
            if (ccc.tabStep != cc.tabStep) {
                this.cursorColumn = i;
                break;
            }
        }

        this.scrollIntoView();
        this.redrawCanvas();
    }

    movePreviousColumn() {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumns = getCursorColumns(renderColumns);

        let ccc = cursorColumns[this.cursorColumn];
        let i: number;

        // first scan backwards until tabStep changes
        for (i = this.cursorColumn - 1; i >= 0; i--) {
            const cc = cursorColumns[i];
            if (ccc.tabStep != cc.tabStep) {
                break;
            }
        }

        ccc = cursorColumns[i];

        // then find first column in current tabstep
        for (; i >= 0; i--) {
            const cc = cursorColumns[i];
            if (ccc.tabStep != cc.tabStep) {
                break;
            }
        }

        this.cursorColumn = i + 1;

        this.scrollIntoView();
        this.redrawCanvas();
    }

    moveHome() {
        this.cursorColumn = 0;
        this.scrollIntoView();
        this.redrawCanvas();
    }

    moveEnd() {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumns = getCursorColumns(renderColumns);
        this.cursorColumn = cursorColumns.length - 1;
        this.scrollIntoView();
        this.redrawCanvas();
    }

    scrollIntoView() {
        const ctx = this.canvas.getContext("2d");
        ctx.font = "14px monospace";
        const em = ctx.measureText("M");
        const fontHeight = em.fontBoundingBoxAscent + em.fontBoundingBoxDescent;

        const visibleRows = Math.floor(this.canvas.height / fontHeight) - 1;

        if (this.cursorTime - this.scrollRow > visibleRows) {
            this.scrollRow = this.cursorTime - visibleRows
        }

        if (this.cursorTime - this.scrollRow < 0) {
            this.scrollRow = this.cursorTime;
        }
    }

    deleteAtCursor() {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;
        const patternEvent = patternColumn.events.find(e => e.time === this.cursorTime && e.channel === cursorColumn.channel);
        this.app.song.deletePatternEvent(patternColumn, patternEvent);
    }

    getNoteForKey(code: string) {
        const kbTop = [ "KeyQ", "Digit2", "KeyW", "Digit3", "KeyE", "KeyR", "Digit5", "KeyT", "Digit6", "KeyY", "Digit7", "KeyU", ];
        const kbBottom = [ "KeyZ", "KeyS", "KeyX", "KeyD", "KeyC", "KeyV", "KeyG", "KeyB", "KeyH", "KeyN", "KeyJ", "KeyM", ];

        const t = kbTop.findIndex(k => k === code);
        if (t !== -1) {
            return 60 + t;
        }

        const b = kbBottom.findIndex(k => k === code);
        if (b !== -1) {
            return 48 + b;
        }

        return -1;
    }

    private editNoteKeyDown(ev: KeyboardEvent, cursorColumn: CursorColumnInfo) {

        if (ev.repeat) {
            return false;
        }

        const note = this.getNoteForKey(ev.code);
        if (note !== -1) {
            this.editNote(note);

            // Send midi to instrumnt
            // TODO: stuck notes if canvas loses focus before key up
            const instrument = cursorColumn.renderColumn.patternColumn.instrument;
            const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(instrument);
            playerInstrument.sendMidi(0, 0x90, note, 127);
            return true;
        }

        switch (ev.key) {
            case "1":
                this.editNoteOff();
                return true;
        }

        return false;
    }

    editNoteKeyUp(ev: KeyboardEvent, cursorColumn: CursorColumnInfo) {
        const note = this.getNoteForKey(ev.code);
        if (note !== -1) {
            const instrument = cursorColumn.renderColumn.patternColumn.instrument;
            const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(instrument);
            playerInstrument.sendMidi(0, 0x90, note, 0);
        }
    }

    private editNumberKeyDown(e: KeyboardEvent) {
        switch (e.key) {
            case "0":
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                this.editDigit(e.key.charCodeAt(0) - 48);
                e.stopPropagation(); // dont run global handler
                e.preventDefault(); // dont do canvas default
                return true;
            case "A":
            case "B":
            case "C":
            case "D":
            case "E":
            case "F":
                this.editDigit(e.key.charCodeAt(0) - 65 + 10);
                e.stopPropagation(); // dont run global handler
                e.preventDefault(); // dont do canvas default
                return true;
            case "a":
            case "b":
            case "c":
            case "d":
            case "e":
            case "f":
                this.editDigit(e.key.charCodeAt(0) - 97 + 10);
                e.stopPropagation(); // dont run global handler
                e.preventDefault(); // dont do canvas default
                return true;
        }
    }

    editNoteOff() {
        // find previous note in same channel
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        const previousPatternEvent = patternColumn.events.reduce((prev, e) => (e.channel === cursorColumn.channel && (e.time < this.cursorTime)) ? e : prev, null);
        if (!previousPatternEvent) {
            console.log("Cannot set note off here, no previous note in channel", patternColumn.events);
            return;
        }

        // if previous note is a noteoff, delete it before inserting a new noteoff after it
        if (previousPatternEvent.data0 == 0) {
            this.app.song.deletePatternEvent(patternColumn, previousPatternEvent);
        }

        // if next note is a noteoff, delete it before inserting a new noteoff before it
        const nextPatternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time > this.cursorTime);
        if (nextPatternEvent && nextPatternEvent.data0 === 0) {
            this.app.song.deletePatternEvent(patternColumn, nextPatternEvent);
        }

        const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime);

        if (patternEvent) {
            this.app.song.updatePatternEvent(patternEvent, previousPatternEvent.value, 0, patternEvent.data1);
        } else {
            this.app.song.createPatternEvent(patternColumn, this.cursorTime, previousPatternEvent.value, 0, 0, cursorColumn.channel);
        }

    }

    editNote(note: number) {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;
        const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime);

        if (patternEvent) {
            this.app.song.updatePatternEvent(patternEvent, note, patternEvent.data0, patternEvent.data1);
        } else {
            this.app.song.createPatternEvent(patternColumn, this.cursorTime, note, 127, 0, cursorColumn.channel);
        }

        // TODO; if next note is noteoff, update its note value
        const nextPatternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time > this.cursorTime);
        if (nextPatternEvent && nextPatternEvent.data0 === 0) {
            this.app.song.updatePatternEvent(nextPatternEvent, note, 0, cursorColumn.channel);
        }
    }

    editDigit(digit: number) {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;
        const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime);

        if (cursorColumn.type === "u4-lower") {
            const newValue = ((patternEvent?.value??0) & 0xF0) | digit;

            if (patternEvent) {
                this.app.song.updatePatternEvent(patternEvent, newValue, patternEvent.data0, patternEvent.data1);
            } else {
                this.app.song.createPatternEvent(patternColumn, this.cursorTime, newValue, 0, 0, cursorColumn.channel);
            }
        } else if (cursorColumn.type === "u4-upper") {
            const newValue = ((patternEvent?.value??0) & 0x0F) | (digit << 4);

            if (patternEvent) {
                this.app.song.updatePatternEvent(patternEvent, newValue, patternEvent.data0, patternEvent.data1);
            } else {
                this.app.song.createPatternEvent(patternColumn, this.cursorTime, newValue, 0, 0, cursorColumn.channel);
            }
        } else if (cursorColumn.type == "u4-velo-lower") {
            const newValue = ((patternEvent?.data0??0) & 0xF0) | digit;
            if (patternEvent) {
                this.app.song.updatePatternEvent(patternEvent, patternEvent.value, newValue, patternEvent.data1);
            } else {
                console.log("Cannote change velocity: No note at current position")
            }
        } else if (cursorColumn.type == "u4-velo-upper") {
            const newValue = ((patternEvent?.data0??0) & 0x0F) | (digit << 4);
            if (patternEvent) {
                this.app.song.updatePatternEvent(patternEvent, patternEvent.value, newValue, patternEvent.data1);
            } else {
                console.log("Cannote change velocity: No note at current position")
            }
        }
    }

    setPattern(pattern: PatternDocument) {
        this.pattern = pattern;
        this.redrawCanvas();
    }

    redrawCanvas() {
        const ctx = this.canvas.getContext("2d");

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "14px monospace";

        const em = ctx.measureText("M");
        const fontHeight = em.fontBoundingBoxAscent + em.fontBoundingBoxDescent;

        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);

        // draw 16/4 row colorings

        let x = 0;
        let lastInstrument: InstrumentDocument;

        for (let renderColumn of renderColumns) {
            const patternColumn = renderColumn.patternColumn;

            // print instrument name/pin in column
            if (lastInstrument !== patternColumn.instrument) {
                ctx.fillStyle = "#FFF";
                ctx.fillText(patternColumn.instrument.name + " - " + patternColumn.instrument.instrumentId, x, 0 + em.fontBoundingBoxAscent)

                lastInstrument = patternColumn.instrument;
            }

            for (let patternEvent of patternColumn.events) {
                if (patternEvent.channel !== renderColumn.channel) {
                    continue;
                }

                let eventScreenTime = patternEvent.time - this.scrollRow;
                if (eventScreenTime < 0) {
                    continue;
                }

                ctx.fillStyle = "#FFF";

                if (renderColumn.type === "note") {
                    if (patternEvent.data0 !== 0) {
                        ctx.fillText(formatNote(patternEvent.value), x, eventScreenTime * fontHeight + em.fontBoundingBoxAscent + fontHeight)
                    } else {
                        ctx.fillText("---", x, eventScreenTime * fontHeight + em.fontBoundingBoxAscent + fontHeight)
                    }
                } else if (renderColumn.type === "velo") {
                    if (patternEvent.data0 != 0) {
                        ctx.fillText(formatU8(patternEvent.data0), x, eventScreenTime * fontHeight + em.fontBoundingBoxAscent + fontHeight)
                    } else {
                        ctx.fillText("--", x, eventScreenTime * fontHeight + em.fontBoundingBoxAscent + fontHeight)
                    }
                } else {
                    const value = patternEvent.value;
                    ctx.fillText(formatU8(value), x, eventScreenTime * fontHeight + em.fontBoundingBoxAscent + fontHeight)
                }
            }

            let columnWidth = getRenderColumnWidth(renderColumn.type);
            x += columnWidth * em.width;

            ctx.strokeStyle = "#000";
            ctx.beginPath();
            ctx.moveTo(x - 1, fontHeight);
            ctx.lineTo(x - 1, this.canvas.height);
            ctx.stroke();
        }

        // cursor
        const currentCursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        if (currentCursorColumn) {
            ctx.save();
            const cursorX = currentCursorColumn.position * em.width;
            const cursorWidth = currentCursorColumn.size * em.width;
            ctx.fillStyle = "#FFF";
            ctx.globalCompositeOperation = "difference";
            ctx.fillRect(cursorX, ((this.cursorTime - this.scrollRow) * fontHeight) + fontHeight, cursorWidth, fontHeight)
            ctx.restore();
        }

        // scroll
        const visibleRows = Math.floor(this.canvas.height / fontHeight) - 1;
        const totalRows = this.pattern.duration;

        ctx.strokeStyle = "#FFF";
        ctx.strokeRect(this.canvas.width - 20, 0, 20, this.canvas.height)

        const scrollbarHeight = Math.floor((visibleRows / totalRows) * this.canvas.height);
        const scrollbarPosition = Math.floor((this.scrollRow / totalRows) * this.canvas.height);

        ctx.fillStyle = "#AAA";
        ctx.fillRect(this.canvas.width - 20, scrollbarPosition, 20, scrollbarHeight);
    }

    getDomNode(): Node {
        return this.container;
    }
}
