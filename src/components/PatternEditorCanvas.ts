import { DragTarget, formatHotkey, ICommandHost, IComponent, INotify } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { Appl } from "../App";
import { InstrumentDocument, PatternDocument } from "../audio/SongDocument";
import { CursorColumnInfo, deleteValue, editNote, editNoteOff, editValue, editVelocity, formatNote, formatU8, getCursorColumnAt, getCursorColumnAtPosition, getCursorColumnIndex, getCursorColumns, getPatternRenderColumns, getRenderColumnIndex, getRenderColumnPosition, getRenderColumnWidth, RenderColumnInfo } from "./PatternEditorHelper";
import { patternMenu } from "../menu/menu";

const maxPolyphonic = 8;

interface PatternSelection {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
}

class DragSelect extends DragTarget {
    component: PatternEditorCanvas;
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;

    constructor(component: PatternEditorCanvas, e: PointerEvent) {
        super();

        this.component = component;

        const fontHeight = this.component.fontEm.fontBoundingBoxAscent + this.component.fontEm.fontBoundingBoxDescent;
        const c = Math.floor((e.offsetX - this.component.rowNumberWidth) / this.component.fontEm.width);
        const t = Math.floor(e.offsetY / fontHeight) - 1 + this.component.scrollRow;
        const cursorColumn = getCursorColumnAtPosition(this.component.renderColumns, c);
        if (!cursorColumn) { // TODO
            throw new Error("getCursorColumnAtPosition should always give a match")
        }

        this.startColumn = getRenderColumnIndex(this.component.renderColumns, cursorColumn.renderColumn);
        this.startRow = t;
    }

    move(e: PointerEvent) {
        const fontHeight = this.component.fontEm.fontBoundingBoxAscent + this.component.fontEm.fontBoundingBoxDescent;
        const c = Math.floor((e.offsetX - this.component.rowNumberWidth) / this.component.fontEm.width);
        const t = Math.floor(e.offsetY / fontHeight) - 1 + this.component.scrollRow;

        const cursorColumn = getCursorColumnAtPosition(this.component.renderColumns, c);

        this.endColumn = getRenderColumnIndex(this.component.renderColumns, cursorColumn.renderColumn);
        this.endRow = t;

        this.component.setSelection(this.startColumn, this.startRow, this.endColumn, this.endRow);
    }

    up(e: PointerEvent) {
        const fontHeight = this.component.fontEm.fontBoundingBoxAscent + this.component.fontEm.fontBoundingBoxDescent;
        const c = Math.floor((e.offsetX - this.component.rowNumberWidth) / this.component.fontEm.width);
        const t = Math.floor(e.offsetY / fontHeight) - 1 + this.component.scrollRow;

        const cursorColumn = getCursorColumnAtPosition(this.component.renderColumns, c);

        this.component.cursorColumn = getCursorColumnIndex(this.component.renderColumns, cursorColumn);
        this.component.cursorTime = t;

        this.component.redrawCanvas();
        this.component.parent.notify(this.component, "cursormove")
    }

}

export class PatternEditorCanvas implements IComponent {
    app: Appl;
    parent: INotify;
    dragTarget: DragTarget;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    cursorColumn: number = 0;
    cursorTime: number = 0;
    pattern: PatternDocument;
    scrollRow: number = 0;
    octave: number = 4;

    renderColumns: RenderColumnInfo[];
    cursorColumns: CursorColumnInfo[];
    fontEm: TextMetrics;
    rowNumberWidth: number;
    selection: PatternSelection;

    constructor(app: Appl, parent: INotify) {
        this.app = app;
        this.parent = parent;
        this.container = document.createElement("div");
        this.container.className = "flex-1 w-full pb-1";
        this.container.tabIndex = 0;
        this.container.addEventListener("keydown", this.onKeyDown);
        this.container.addEventListener("keyup", this.onKeyUp);

        this.canvas = FlexCanvas();
        this.canvas.classList.add("rounded-lg");

        this.canvas.addEventListener("pointerdown", this.onMouseDown);
        this.canvas.addEventListener("pointerup", this.onMouseUp);
        this.canvas.addEventListener("pointermove", this.onMouseMove);
        this.canvas.addEventListener("contextmenu", this.onContextMenu);

        this.canvas.addEventListener("resize", this.onResize);

        this.container.appendChild(this.canvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);

        const ctx = this.canvas.getContext("2d");
        ctx.font = "14px monospace";

        this.fontEm = ctx.measureText("M");
        this.rowNumberWidth = this.fontEm.width * 5;

        this.setPattern(null);
    }

    onMounted = () => {
        this.app.song.addEventListener("updateInstrument", this.onResize);
        this.app.song.addEventListener("updatePattern", this.onRebind);
        this.app.song.addEventListener("deletePattern", this.onDeletePattern);
        this.app.song.addEventListener("createPatternColumn", this.onRebind);
        this.app.song.addEventListener("updatePatternColumn", this.onRebind);
        this.app.song.addEventListener("createPatternEvent", this.onResize);
        this.app.song.addEventListener("updatePatternEvent", this.onResize);
        this.app.song.addEventListener("deletePatternEvent", this.onResize);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("updateInstrument", this.onResize);
        this.app.song.removeEventListener("updatePattern", this.onRebind);
        this.app.song.removeEventListener("deletePattern", this.onDeletePattern);
        this.app.song.removeEventListener("createPatternColumn", this.onRebind);
        this.app.song.removeEventListener("updatePatternColumn", this.onRebind);
        this.app.song.removeEventListener("createPatternEvent", this.onResize);
        this.app.song.removeEventListener("updatePatternEvent", this.onResize);
        this.app.song.removeEventListener("deletePatternEvent", this.onResize);
    };

    onDeletePattern = (ev: CustomEvent<PatternDocument>) => {
        if (ev.detail === this.pattern) {
            this.setPattern(null);
        }
    };

    onRebind = () => {
        this.setPattern(this.pattern);
    };

    onResize = () => {
        this.redrawCanvas();
    };

    onMouseDown = (e: PointerEvent) => {
        if (!this.dragTarget) {
            // this.clearSelection();

            this.dragTarget = new DragSelect(this, e);
            this.canvas.setPointerCapture(e.pointerId);
        }
    };

    onMouseUp = (e: PointerEvent) => {
        if (!this.dragTarget) {
            return;
        }

        this.canvas.releasePointerCapture(e.pointerId);
        this.dragTarget.up(e);
        this.dragTarget = null;
    };

    onMouseMove = (e: PointerEvent) => {
        if (!this.dragTarget) {
            return;
        }

        this.dragTarget.move(e);
    };

    onContextMenu = (e: MouseEvent) => {
        console.log("onContextMenu")
        const rc = this.canvas.getBoundingClientRect();

        // TODO: dont cast
        this.app.contextMenuContainer.show(this.parent as ICommandHost, rc.left + e.offsetX, rc.top + e.offsetY, patternMenu);
        e.preventDefault();
    };

    onKeyDown = (e: KeyboardEvent) => {
        if (this.editKeyDown(e)) {
            this.parent.notify(this, "cursormove")
            e.stopPropagation(); // dont run global handler
            e.preventDefault(); // dont do canvas default
            return;
        }
    };

    onKeyUp = (e: KeyboardEvent) => {
        this.editKeyUp(e);
    };

    editKeyDown(e: KeyboardEvent) {
        // NOTE: There is an idea to emit "cursormove" events only in response to "internal actions",
        // as opposed to not sending events due to "external actions" triggered in the parent component.
        // This is how the wave editor syncronizes the two edit/scroll canvases to avoid event cycles.
        // The way things are now, keyboard inputs are considered "external", whereas mouse is "internal":
        // The parent has focus, handles keyboard events and forwards to the canvas.
        // On the other hand, the canvas handles mouse events directly, and thus needs to notify the parent
        // when the mouse moves the cursor.
        // Thats why this doesn't emit "cursormove" events, while the onMouseDown handler does.

        // TODO: The above is no longer correct, the canvas has the focus now

        if (!this.pattern) {
            return false;
        }
    
        const key = formatHotkey(e);

        switch (key) {
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
            case "Backspace":
                if (this.moveCursor(0, -1)) {
                    if (this.deleteAtCursor()) {
                        this.shiftEventsAfterCursor(-1);
                    } else {
                        this.moveCursor(0, 1);
                    }
                }
                return true;
            case "Insert":
                this.shiftEventsAfterCursor(1);
                return true;
            case "Tab":
                this.moveNextColumn();
                return true;
            case "SHIFT+Tab":
                this.movePreviousColumn();
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

        if (this.renderColumns.length === 0) return;

        if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
            return false;
        }

        const cursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        if (cursorColumn.type === "u4-basenote") {
            return this.editNoteKeyDown(e, cursorColumn);
        } else {
            return this.editNumberKeyDown(e);
        }

        return false;
    }

    editKeyUp(e: KeyboardEvent) {
        if (this.renderColumns.length === 0) return;

        const cursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        if (cursorColumn.type === "u4-basenote") {
            this.editNoteKeyUp(e, cursorColumn);
        }
    };

    moveCursor(dx, dy) {
        const ct = this.cursorTime;
        const cc = this.cursorColumn;
        this.cursorTime = Math.max(Math.min(this.cursorTime + dy, this.pattern.duration - 1), 0);
        this.cursorColumn = Math.max(Math.min(this.cursorColumn + dx, this.cursorColumns.length - 1), 0);
        
        this.scrollIntoView();
        this.redrawCanvas();

        // Returns true if the cursor moved
        return ct !== this.cursorTime || cc !== this.cursorColumn;
    }

    moveNextColumn() {
        const ccc = this.cursorColumns[this.cursorColumn];

        for (let i = this.cursorColumn + 1; i < this.cursorColumns.length; i++) {
            const cc = this.cursorColumns[i];
            if (ccc.tabStep != cc.tabStep) {
                this.cursorColumn = i;
                break;
            }
        }

        this.scrollIntoView();
        this.redrawCanvas();
    }

    movePreviousColumn() {
        let ccc = this.cursorColumns[this.cursorColumn];
        let i: number;

        // first scan backwards until tabStep changes
        for (i = this.cursorColumn - 1; i >= 0; i--) {
            const cc = this.cursorColumns[i];
            if (ccc.tabStep != cc.tabStep) {
                break;
            }
        }

        ccc = this.cursorColumns[i];

        // then find first column in current tabstep
        for (; i >= 0; i--) {
            const cc = this.cursorColumns[i];
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
        this.cursorColumn = this.cursorColumns.length - 1;
        this.scrollIntoView();
        this.redrawCanvas();
    }

    scrollIntoView() {
        const ctx = this.canvas.getContext("2d");
        ctx.font = "14px monospace";
        const em = ctx.measureText("M");
        const fontHeight = em.fontBoundingBoxAscent + em.fontBoundingBoxDescent;

        const visibleRows = Math.floor(this.canvas.height / fontHeight);
        if (visibleRows <= 0) return;

        // The +1 is to ensure the whole row is in view
        if (this.cursorTime + 1 - this.scrollRow > visibleRows) {
            this.scrollRow = this.cursorTime + 1 - visibleRows
        }

        if (this.cursorTime - this.scrollRow < 0) {
            this.scrollRow = this.cursorTime;
        }
    }

    shiftEventsAfterCursor(delta: number) {
        // add +1 to all events time at cursor and below, delete events outside pattern, leave noteoffs at end
        const cursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        const events = patternColumn.events.filter(e => e.channel === cursorColumn.channel && e.time >= this.cursorTime);
        for (let patternEvent of events) {
            this.app.song.deletePatternEvent(patternColumn, patternEvent);

            this.app.song.createPatternEvent(patternColumn, patternEvent.time + delta, patternEvent.value, patternEvent.data0, patternEvent.data1, patternEvent.channel);
        }
    }

    deleteAtCursor() {
        // can be note and noteoff on same time/channel: if both = delete note
        const cursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        deleteValue(this.app.song, cursorColumn.renderColumn.patternColumn, cursorColumn.renderColumn.type, this.cursorTime, cursorColumn.channel);

        // Returns true if all events were deleted at this position = can shift
        const events = cursorColumn.renderColumn.patternColumn.events.filter(e => e.channel === cursorColumn.channel && e.time === this.cursorTime);
        return events.length === 0;
    }

    getNoteForKey(code: string) {
        const kbTop = [ "KeyQ", "Digit2", "KeyW", "Digit3", "KeyE", "KeyR", "Digit5", "KeyT", "Digit6", "KeyY", "Digit7", "KeyU", ];
        const kbBottom = [ "KeyZ", "KeyS", "KeyX", "KeyD", "KeyC", "KeyV", "KeyG", "KeyB", "KeyH", "KeyN", "KeyJ", "KeyM", ];

        const t = kbTop.findIndex(k => k === code);
        if (t !== -1) {
            return (this.octave + 1) * 12 + t;
        }

        const b = kbBottom.findIndex(k => k === code);
        if (b !== -1) {
            return this.octave * 12 + b;
        }

        return -1;
    }

    private editNoteKeyDown(ev: KeyboardEvent, cursorColumn: CursorColumnInfo) {

        if (ev.repeat) {
            return false;
        }

        const note = this.getNoteForKey(ev.code);
        if (note !== -1) {
            this.editNoteAtCursor(note);

            // Send midi to instrumnt
            // TODO: stuck notes if canvas loses focus before key up
            const instrument = cursorColumn.renderColumn.patternColumn.instrument;
            const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(instrument);
            playerInstrument.sendMidi(0, 0x90, note, 127);
            return true;
        }

        switch (ev.key) {
            case "1":
                this.editNoteOffAtCursor();
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

    editNoteOffAtCursor() {
        const cursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        // - already noteoff, exit
        // - TODO: already note = set note-off for previous note here
        // - else shorten or extend noteoff

        editNoteOff(this.app.song, patternColumn, this.cursorTime, cursorColumn.channel);
    }

    editNoteAtCursor(note: number) {
        const cursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        editNote(this.app.song, patternColumn, this.cursorTime, cursorColumn.channel, note);
    }

    editDigit(digit: number) {
        const cursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        if (cursorColumn.type === "u4-lower") {
            const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime);
            const newValue = ((patternEvent?.value??0) & 0xF0) | digit;

            editValue(this.app.song, patternColumn, this.cursorTime, patternEvent.channel, newValue);

            // if (patternEvent) {
            //     this.app.song.updatePatternEvent(patternEvent, newValue, patternEvent.data0, patternEvent.data1);
            // } else {
            //     this.app.song.createPatternEvent(patternColumn, this.cursorTime, newValue, 0, 0, cursorColumn.channel);
            // }
        } else if (cursorColumn.type === "u4-upper") {
            const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime);
            const newValue = ((patternEvent?.value??0) & 0x0F) | (digit << 4);
            editValue(this.app.song, patternColumn, this.cursorTime, patternEvent.channel, newValue);

            // if (patternEvent) {
            //     this.app.song.updatePatternEvent(patternEvent, newValue, patternEvent.data0, patternEvent.data1);
            // } else {
            //     this.app.song.createPatternEvent(patternColumn, this.cursorTime, newValue, 0, 0, cursorColumn.channel);
            // }
        } else if (cursorColumn.type == "u4-velo-lower") {
            const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime && e.data0 !== 0);
            const newValue = ((patternEvent?.data0??0) & 0xF0) | digit;
            editVelocity(this.app.song, patternEvent, newValue);
            // if (patternEvent) {
            //     this.app.song.updatePatternEvent(patternEvent, patternEvent.value, newValue, patternEvent.data1);
            // } else {
            //     console.log("Cannote change velocity: No note at current position")
            // }
        } else if (cursorColumn.type == "u4-velo-upper") {
            const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime && e.data0 !== 0);
            const newValue = ((patternEvent?.data0??0) & 0x0F) | (digit << 4);
            editVelocity(this.app.song, patternEvent, newValue);
            // if (patternEvent) {
            //     this.app.song.updatePatternEvent(patternEvent, patternEvent.value, newValue, patternEvent.data1);
            // } else {
            //     console.log("Cannote change velocity: No note at current position")
            // }
        }
    }

    setPattern(pattern: PatternDocument) {
        this.pattern = pattern;

        if (this.pattern) {
            this.renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
            this.cursorColumns = getCursorColumns(this.renderColumns);
        } else {
            this.renderColumns = [];
            this.cursorColumns = [];
        }

        this.redrawCanvas();
    }

    setSelection(startColumn: number, startRow: number, endColumn: number, endRow: number) {
        this.selection = { startColumn, startRow, endColumn, endRow };
        console.log("Set selection:", this.selection);
        this.redrawCanvas();
    }

    redrawCanvas() {
        const ctx = this.canvas.getContext("2d");

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "14px monospace";

        const fontHeight = this.fontEm.fontBoundingBoxAscent + this.fontEm.fontBoundingBoxDescent;

        // draw row colorings

        let x = 0;
        let lastInstrument: InstrumentDocument;

        const visibleRows = Math.floor(this.canvas.height / fontHeight);
        const totalRows = this.pattern?.duration ?? 0;

        const rowNumberWidth = this.fontEm.width * 5;
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFF";
        for (let i = 0; i < Math.min(visibleRows, totalRows); i++) {
            const rowNumber = (this.scrollRow + i);
            let rowColor: string;
            if ((rowNumber % 16) === 0) {
                rowColor = "#201820";
            } else if ((rowNumber % 4) === 0) {
                rowColor = "#101010";
            } else {
                rowColor = null;
            }

            if (rowColor) {
                ctx.fillStyle = rowColor
                ctx.fillRect(x, (i + 1) * fontHeight, this.canvas.width - x, fontHeight)
            }

            ctx.fillStyle = "#FFF";
            ctx.fillText(rowNumber.toString(), x + rowNumberWidth - this.fontEm.width, (i + 1) * fontHeight + this.fontEm.fontBoundingBoxAscent);
        }

        ctx.textAlign = "left";

        x += rowNumberWidth;

        if (this.selection) {
            const c1 = Math.min(this.selection.startColumn, this.selection.endColumn);
            const c2 = Math.max(this.selection.startColumn, this.selection.endColumn);
            const selectStartColumn = this.renderColumns[c1];
            const selectEndColumn = this.renderColumns[c2];

            const x1 = getRenderColumnPosition(this.renderColumns, selectStartColumn) * this.fontEm.width;
            const x2 = (getRenderColumnPosition(this.renderColumns, selectEndColumn) + getRenderColumnWidth(selectEndColumn.type)) * this.fontEm.width;

            let y1 = (Math.min(this.selection.startRow, this.selection.endRow) - this.scrollRow) * fontHeight;
            let y2 = (Math.max(this.selection.startRow, this.selection.endRow) - this.scrollRow + 1) * fontHeight;

            ctx.fillStyle = "#444";
            ctx.fillRect(x + x1, fontHeight + y1, (x2 - x1), y2 - y1);
        }

        for (let renderColumn of this.renderColumns) {
            const patternColumn = renderColumn.patternColumn;

            // print instrument name/pin in column
            if (lastInstrument !== patternColumn.instrument) {
                ctx.fillStyle = "#FFF";
                ctx.fillText(patternColumn.instrument.name + " - " + patternColumn.instrument.instrumentId, x, 0 + this.fontEm.fontBoundingBoxAscent)

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
                        ctx.fillText(formatNote(patternEvent.value), x, eventScreenTime * fontHeight + this.fontEm.fontBoundingBoxAscent + fontHeight)
                    } else {
                        ctx.fillText("¯¯¯", x, eventScreenTime * fontHeight + this.fontEm.fontBoundingBoxAscent + fontHeight)
                    }
                } else if (renderColumn.type === "velo") {
                    if (patternEvent.data0 != 0) {
                        ctx.fillText(formatU8(patternEvent.data0), x, eventScreenTime * fontHeight + this.fontEm.fontBoundingBoxAscent + fontHeight)
                    } else {
                        ctx.fillText("¯¯", x, eventScreenTime * fontHeight + this.fontEm.fontBoundingBoxAscent + fontHeight)
                    }
                } else {
                    const value = patternEvent.value;
                    ctx.fillText(formatU8(value), x, eventScreenTime * fontHeight + this.fontEm.fontBoundingBoxAscent + fontHeight)
                }
            }

            let columnWidth = getRenderColumnWidth(renderColumn.type);
            x += columnWidth * this.fontEm.width;

            ctx.strokeStyle = "#000";
            ctx.beginPath();
            ctx.moveTo(x - 1, fontHeight);
            ctx.lineTo(x - 1, this.canvas.height);
            ctx.stroke();
        }

        // cursor
        const currentCursorColumn = getCursorColumnAt(this.renderColumns, this.cursorColumn);
        if (currentCursorColumn) {
            ctx.save();
            const cursorX = rowNumberWidth + currentCursorColumn.position * this.fontEm.width;
            const cursorWidth = currentCursorColumn.size * this.fontEm.width;
            ctx.fillStyle = "#FFF";
            ctx.globalCompositeOperation = "difference";
            ctx.fillRect(cursorX, ((this.cursorTime - this.scrollRow) * fontHeight) + fontHeight, cursorWidth, fontHeight)
            ctx.restore();
        }

        // scroll
        ctx.fillStyle = "#333";
        ctx.fillRect(this.canvas.width - 20, 0, 20, this.canvas.height)

        const scrollbarHeight = Math.floor((visibleRows / totalRows) * this.canvas.height);
        const scrollbarPosition = Math.floor((this.scrollRow / totalRows) * this.canvas.height);

        ctx.fillStyle = "#AAA";
        ctx.fillRect(this.canvas.width - 20, scrollbarPosition, 20, scrollbarHeight);
    }

    getDomNode(): Node {
        return this.container;
    }
}
