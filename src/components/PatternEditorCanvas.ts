import { IComponent } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { Appl } from "../App";
import { InstrumentDocument, PatternColumnDocument, PatternDocument } from "../audio/SongDocument";
import { CursorColumnInfo, formatNote, formatU8, getCursorColumnAt, getCursorColumnAtPosition, getCursorColumnIndex, getCursorColumns, getPatternRenderColumns, getRenderColumnWidth, RenderColumnInfo } from "./PatternEditorHelper";

const maxPolyphonic = 8;

function getPreviousPatternEvent(patternColumn: PatternColumnDocument, time: number, channel: number) {
    return patternColumn.events.reduce((prev, e) => (e.channel === channel && (e.time < time)) ? e : prev, null);
}

function getNextPatternEvent(patternColumn: PatternColumnDocument, time: number, channel: number, note?: number) {
    return patternColumn.events.find(e => e.channel === channel && e.time > time && (note === undefined || e.value === note));
}

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

        const rowNumberWidth = em.width * 5;
        const c = Math.floor((e.offsetX - rowNumberWidth) / em.width);

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
                this.shiftEventsAfterCursor(-1);
                return true;
            case "Backspace":
                this.deleteAtCursor();
                return true;
            case "Insert":
                this.shiftEventsAfterCursor(1);
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

    shiftEventsAfterCursor(delta: number) {
        // add +1 to all events time at cursor and below, delete events outside pattern, leave noteoffs at end
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        const events = patternColumn.events.filter(e => e.channel === cursorColumn.channel && e.time >= this.cursorTime);
        for (let patternEvent of events) {
            this.app.song.deletePatternEvent(patternColumn, patternEvent);

            this.app.song.createPatternEvent(patternColumn, patternEvent.time + delta, patternEvent.value, patternEvent.data0, patternEvent.data1, patternEvent.channel);
        }
    }

    deleteAtCursor() {
        // can be note and noteoff on same time/channel: if both = delete note
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        if (cursorColumn.type === "u4-basenote" || cursorColumn.type === "u4-octave") {
            // Delete in a note column
            const editNoteEvent = patternColumn.events.find(e => e.time === this.cursorTime && e.channel === cursorColumn.channel && e.data0 !== 0);
            const editNoteOffEvent = patternColumn.events.find(e => e.time === this.cursorTime && e.channel === cursorColumn.channel && e.data0 === 0);

            if (editNoteEvent) {
                const noteOffEvent = getNextPatternEvent(patternColumn, this.cursorTime, cursorColumn.channel, editNoteEvent.value);
                if (noteOffEvent && noteOffEvent.data0 === 0) {
                    // Delete note and its note-off - if there is a noteoff at the same time, leave the noteoff
                    this.app.song.deletePatternEvent(patternColumn, editNoteEvent);
                    this.app.song.deletePatternEvent(patternColumn, noteOffEvent);
                    return true;
                } else {
                    console.warn("Missing note-off, invalid pattern event, not deleting anything")
                }
            } else if (editNoteOffEvent) {
                // Delete noteoff = extend noteoff until next note or end of pattern
                const nextNoteEvent = getNextPatternEvent(patternColumn, this.cursorTime, cursorColumn.channel);

                if (nextNoteEvent) {
                    if (nextNoteEvent.data0 !== 0) {
                        this.app.song.deletePatternEvent(patternColumn, editNoteOffEvent);
                        this.app.song.createPatternEvent(patternColumn, nextNoteEvent.time, editNoteOffEvent.value, 0, 0, cursorColumn.channel);
                        return true;
                    } else {
                        console.warn("Next note is a noteoff, expected note, not extending the noteoff.", nextNoteEvent)
                    }
                } else {
                    // throwing here to prevent possible shifting afterwards, which could result in wrong noteoffS
                    throw new Error("TODO: the case where noteoff extends to EOP")
                }
            }
        } else {
            // Delete in a non-note column, i.e cc/u8 value
            const patternEvent = patternColumn.events.find(e => e.time === this.cursorTime && e.channel === cursorColumn.channel);
            this.app.song.deletePatternEvent(patternColumn, patternEvent);
            return true;
        }

        return false;
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
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        // - already noteoff, exit
        // - TODO: already note = set note-off for previous note here
        // - else shorten or extend noteoff

        const patternEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime);
        if (patternEvent) {
            console.log("Already note or noteoff here, not inserting noteoff")
            return;
        }

        const previousPatternEvent = getPreviousPatternEvent(patternColumn, this.cursorTime, cursorColumn.channel); // patternColumn.events.reduce((prev, e) => (e.channel === cursorColumn.channel && (e.time < this.cursorTime)) ? e : prev, null);
        if (!previousPatternEvent) {
            console.log("Cannot set note off here, no previous note in channel", patternColumn.events);
            return;
        }

        if (previousPatternEvent.data0 == 0) {
            // if previous note is a noteoff: extend duration, delete old noteoff before new noteoff
            this.app.song.deletePatternEvent(patternColumn, previousPatternEvent);
        } else {
            // previous note is a note: shorten duration, find and delete its noteoff before new noteoff
            const nextPatternEvent = getNextPatternEvent(patternColumn, previousPatternEvent.time, cursorColumn.channel, previousPatternEvent.value);
            if (nextPatternEvent && nextPatternEvent.data0 === 0) {
                this.app.song.deletePatternEvent(patternColumn, nextPatternEvent);
            } else {
                console.warn("Could not find noteoff for previous note. Not shortening")
            }
        }

        this.app.song.createPatternEvent(patternColumn, this.cursorTime, previousPatternEvent.value, 0, 0, cursorColumn.channel);
    }

    editNote(note: number) {
        const renderColumns = getPatternRenderColumns(this.app.instrumentFactories, this.pattern, maxPolyphonic);
        const cursorColumn = getCursorColumnAt(renderColumns, this.cursorColumn);
        const patternColumn = cursorColumn.renderColumn.patternColumn;

        // Get note at cursor position - velo!=0, no noteoff
        const editNoteEvent = patternColumn.events.find(e => e.channel === cursorColumn.channel && e.time == this.cursorTime && e.data0 !== 0);

        // cases:
        // update note / octave -> also update note off
        // update noteoff = insert new note over it
        // insert note before noteoff of another note
        // insert note outside any other notes

        if (editNoteEvent) {

            // find noteoff and update its value
            const nextPatternEvent = getNextPatternEvent(patternColumn, this.cursorTime, cursorColumn.channel, editNoteEvent.value);
            if (nextPatternEvent) {
                // not validating velo==0 before updating, _should_ be the noteoff
                this.app.song.updatePatternEvent(editNoteEvent, note, editNoteEvent.data0, editNoteEvent.data1);
                this.app.song.updatePatternEvent(nextPatternEvent, note, 0, cursorColumn.channel);                    
            } else {
                console.warn("Not updating note off, missing note off, invalid pattern event")
            }
        } else {
            // if previous note is a note -> split, find noteend and move it to here
            // if previous note is a noteoff or none -> insert plain
            const previousPatternEvent = getPreviousPatternEvent(patternColumn, this.cursorTime, cursorColumn.channel);
            if (previousPatternEvent && previousPatternEvent.data0 !== 0) {
                // Insert in duration of another note: shorten previous note
                const noteoffForPrevious = getNextPatternEvent(patternColumn, previousPatternEvent.time, cursorColumn.channel, previousPatternEvent.value);
                if (noteoffForPrevious.data0 === 0) {
                    this.app.song.deletePatternEvent(patternColumn, noteoffForPrevious);
                    this.app.song.createPatternEvent(patternColumn, this.cursorTime, previousPatternEvent.value, 0, 0, cursorColumn.channel);
                } else {
                    console.warn("Not shortening previous note, missing note off, invalid pattern event")
                }
            }

            this.app.song.createPatternEvent(patternColumn, this.cursorTime, note, 127, 0, cursorColumn.channel);
            this.app.song.createPatternEvent(patternColumn, this.cursorTime + 1, note, 0, 0, cursorColumn.channel);
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

        const visibleRows = Math.floor(this.canvas.height / fontHeight) - 1;
        const totalRows = this.pattern.duration;

        const rowNumberWidth = em.width * 5;
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFF";
        for (let i = 0; i < Math.min(visibleRows, totalRows); i++) {
            // TODO; color the whole row with row color vs beat vs subdivision etc
            // 
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
            ctx.fillText((rowNumber + 1).toString(), x + rowNumberWidth - em.width, (i + 1) * fontHeight + em.fontBoundingBoxAscent);
        }

        ctx.textAlign = "left";

        x += rowNumberWidth;

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
            const cursorX = rowNumberWidth + currentCursorColumn.position * em.width;
            const cursorWidth = currentCursorColumn.size * em.width;
            ctx.fillStyle = "#FFF";
            ctx.globalCompositeOperation = "difference";
            ctx.fillRect(cursorX, ((this.cursorTime - this.scrollRow) * fontHeight) + fontHeight, cursorWidth, fontHeight)
            ctx.restore();
        }

        // scroll
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
