import { Appl } from "../App";
import { DragTarget, formatHotkey, IComponent } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { PatternFrame } from "./PatternFrame";

const maxSequencerLength = 1024;

interface SequenceSelection {
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;
}

class DragSelect extends DragTarget {
    component: SequenceEditorCanvas;
    startColumn: number;
    endColumn: number;
    startRow: number;
    endRow: number;

    constructor(component: SequenceEditorCanvas, e: PointerEvent) {
        super();

        this.component = component;

        const fontHeight = this.component.fontEm.fontBoundingBoxAscent + this.component.fontEm.fontBoundingBoxDescent;
        const columnWidth = this.component.fontEm.width * 8;

        const c = Math.floor((e.offsetX - this.component.rowNumberWidth) / columnWidth);
        const t = Math.floor(e.offsetY / fontHeight) + this.component.scrollRow - 1; // -1 for heading

        this.startColumn = c;
        this.startRow = t;
    }

    move(e: PointerEvent) {
        const fontHeight = this.component.fontEm.fontBoundingBoxAscent + this.component.fontEm.fontBoundingBoxDescent;
        const columnWidth = this.component.fontEm.width * 8;

        const c = Math.floor((e.offsetX - this.component.rowNumberWidth) / columnWidth);
        const t = Math.floor(e.offsetY / fontHeight) + this.component.scrollRow - 1; // -1 for heading

        this.endColumn = c;
        this.endRow = t;

        this.component.setSelection(this.startColumn, this.startRow, this.endColumn, this.endRow);
        this.component.dispatchEvent(new CustomEvent("selchange"));
    }

    up(e: PointerEvent) {
        const fontHeight = this.component.fontEm.fontBoundingBoxAscent + this.component.fontEm.fontBoundingBoxDescent;
        const columnWidth = this.component.fontEm.width * 8;

        const c = Math.floor((e.offsetX - this.component.rowNumberWidth) / columnWidth);
        const t = Math.floor(e.offsetY / fontHeight) + this.component.scrollRow - 1; // -1 for heading

        this.component.setCursorPosition(c, t);
        this.component.dispatchEvent(new CustomEvent("cursormove"));
    }
}

export class SequenceEditorCanvas extends EventTarget implements IComponent {
    app: Appl;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    dragTarget: DragTarget;
    cursorColumn: number = 0;
    cursorTime: number = 0;
    scrollRow: number = 0;
    redrawTimer: number = null;

    fontEm: TextMetrics;
    rowNumberWidth: number;
    selection: SequenceSelection;

    constructor(app: Appl) {
        super();
        this.app = app;

        this.container = document.createElement("div");
        this.container.className = "flex-1 w-full";
        this.container.tabIndex = 0;

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
        this.container.addEventListener("keydown", this.onKeyDown);

        const ctx = this.canvas.getContext("2d");
        ctx.font = "14px monospace";

        this.fontEm = ctx.measureText("M");
        this.rowNumberWidth = this.fontEm.width * 5;
    }

    onMounted = async (ev) => {
        if (this.app.player?.playing) {
            this.onPlaying();
        }

        this.app.song.addEventListener("playing", this.onPlaying);
        this.app.song.addEventListener("stopped", this.onStopped);
        this.app.song.addEventListener("updateDocument", this.onResize);
        this.app.song.addEventListener("createSequenceColumn", this.onResize);
        this.app.song.addEventListener("createSequenceEvent", this.onResize);
        this.app.song.addEventListener("updateSequenceEvent", this.onResize);
        this.app.song.addEventListener("deleteSequenceEvent", this.onResize);
    };

    onUnmounted = async () => {
        this.app.song.removeEventListener("playing", this.onPlaying);
        this.app.song.removeEventListener("stopped", this.onStopped);
        this.app.song.removeEventListener("updateDocument", this.onResize);
        this.app.song.removeEventListener("createSequenceColumn", this.onResize);
        this.app.song.removeEventListener("createSequenceEvent", this.onResize);
        this.app.song.removeEventListener("updateSequenceEvent", this.onResize);
        this.app.song.removeEventListener("deleteSequenceEvent", this.onResize);
    };

    onPlaying = () => {
        // Redraw every 100 msec during playback
        this.redrawTimer = setInterval(() => {
            this.redrawCanvas();
        }, 100);
    };

    onStopped = () => {
        clearInterval(this.redrawTimer);
        this.redrawTimer = null;
    };

    onResize = async () => {
        this.redrawCanvas();
    };

    onMouseDown = (e: PointerEvent) => {
        if (!this.dragTarget) {
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

    onContextMenu = (ev: MouseEvent) => {
        // console.log("onContextMenu")
        const target = ev.target as Element;
        const rc = target.getBoundingClientRect()
        const pt = [ rc.left + ev.offsetX, rc.top + ev.offsetY ];

        // this.app.showMenu(sequencerMenu, pt as any);

        ev.preventDefault();
    };

    onKeyDown = (e: KeyboardEvent) => {
        if (this.editKeyDown(e)) {
            this.dispatchEvent(new CustomEvent("selchange"));
            this.dispatchEvent(new CustomEvent("cursormove"));
            e.stopPropagation(); // dont run global handler
            e.preventDefault(); // dont do canvas default
            return;
        }
    };

    editKeyDown(e: KeyboardEvent) {
        // console.log("KEYPP", e.key)
        const key = formatHotkey(e)
        switch (key) {
            case "ArrowUp":
            case "SHIFT+ArrowUp":
                this.moveCursor(0, -1, e.shiftKey);
                return true;
            case "ArrowDown":
            case "SHIFT+ArrowDown":
                this.moveCursor(0, 1, e.shiftKey);
                return true;
            case "ArrowRight":
            case "SHIFT+ArrowRight":
                this.moveCursor(1, 0, e.shiftKey);
                return true;
            case "ArrowLeft":
            case "SHIFT+ArrowLeft":
                this.moveCursor(-1, 0, e.shiftKey);
                return true;
            case "PageUp":
            case "SHIFT+PageUp":
                this.moveCursor(0, -16, e.shiftKey);
                return true;
            case "PageDown":
            case "SHIFT+PageDown":
                this.moveCursor(0, 16, e.shiftKey);
                return true;
            case "Enter":
                // console.log("Enter pattern if event here")
                this.gotoPattern();
                return true;
            case "Delete":
                this.deleteAtCursor();
                return true;
            case "0": case "1": case "2": case "3": case "4":
            case "5": case "6": case "7": case "8": case "9":
                this.editPatternIndex(e.key.charCodeAt(0) - 48);
                return true;
        }
    }

    scrollIntoView() {
        const fontHeight = this.fontEm.fontBoundingBoxAscent + this.fontEm.fontBoundingBoxDescent;

        const visibleRows = Math.floor(this.canvas.height / fontHeight);
        if (visibleRows <= 0) return;

        // The +1 is to ensure the whole row is in view
        if (this.cursorTime + 1 - this.scrollRow >= visibleRows) {
            this.scrollRow = this.cursorTime + 1 - visibleRows
        }

        if (this.cursorTime - this.scrollRow < 0) {
            this.scrollRow = this.cursorTime;
        }
    }

    deleteAtCursor() {
        const sequenceColumn = this.app.song.sequenceColumns[this.cursorColumn];
        const sequenceEvent = sequenceColumn.events.find(e => e.time === this.cursorTime);

        if (sequenceEvent) {
            this.app.song.deleteSequenceEvent(sequenceColumn, sequenceEvent);
        }
    }

    async gotoPattern() {
        const sequenceColumn = this.app.song.sequenceColumns[this.cursorColumn];
        const sequenceEvent = sequenceColumn.events.find(e => e.time === this.cursorTime);

        if (sequenceEvent) {
            const panel = await this.app.executeCommand("show-pattern-editor") as PatternFrame;
            panel.setInstrument(sequenceEvent.pattern.instrument);
            panel.setPattern(sequenceEvent.pattern);
        }
    }

    editPatternIndex(patternIndex: number) {
        const sequenceColumn = this.app.song.sequenceColumns[this.cursorColumn];
        const sequenceEvent = sequenceColumn.events.find(e => e.time === this.cursorTime);
        const pattern = sequenceColumn.instrument.patterns[patternIndex];

        if (!pattern) {
            return;
        }

        if (!sequenceEvent) {
            this.app.song.createSequenceEvent(sequenceColumn, this.cursorTime, pattern);
        } else {
            this.app.song.updateSequenceEvent(sequenceEvent, pattern);
        }
    }

    setCursorPosition(x: number, y: number) {
        this.cursorTime = Math.min(Math.max(0, y), maxSequencerLength - 1);
        this.cursorColumn = Math.min(Math.max(0, x), this.app.song.sequenceColumns.length - 1);
        this.scrollIntoView();
        this.redrawCanvas();
    }

    moveCursor(dx: number, dy: number, withSelection: boolean = false) {
        console.log("MOEV", dx, dy)

        if (!withSelection) {
            this.clearSelection();
        } else {
            if (!this.selection) {
                this.setSelection(this.cursorColumn, this.cursorTime, this.cursorColumn, this.cursorTime);
            }
        }

        this.cursorTime = Math.min(Math.max(0, this.cursorTime + dy), maxSequencerLength - 1);
        this.cursorColumn = Math.min(Math.max(0, this.cursorColumn + dx), this.app.song.sequenceColumns.length - 1);

        if (withSelection) {
            this.setSelection(this.selection.startColumn, this.selection.startRow, this.cursorColumn, this.cursorTime);
        }

        this.scrollIntoView();
        this.redrawCanvas();
        return true;
    }

    clearSelection() {
        if (!this.selection) {
            return;
        }

        this.selection = null;
        this.redrawCanvas();
    }

    setSelection(startColumn: number, startRow: number, endColumn: number, endRow: number) {
        startColumn = Math.min(Math.max(0, startColumn), this.app.song.sequenceColumns.length - 1);
        endColumn = Math.min(Math.max(0, endColumn), this.app.song.sequenceColumns.length - 1);
        startRow = Math.min(Math.max(0, startRow), maxSequencerLength - 1);
        endRow = Math.min(Math.max(0, endRow), maxSequencerLength - 1);

        if (this.selection && 
            this.selection.startColumn === startColumn && this.selection.startRow === startRow &&
            this.selection.endColumn === endColumn && this.selection.endRow === endRow)
        {
            return;
        }

        this.selection = { startColumn, startRow, endColumn, endRow };
        // console.log("Set selection:", this.selection);
        this.redrawCanvas();
    }

    redrawCanvas() {
        const ctx = this.canvas.getContext("2d");

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "14px monospace";

        const fontHeight = this.fontEm.fontBoundingBoxAscent + this.fontEm.fontBoundingBoxDescent;
        const rowNumberWidth = this.fontEm.width * 5;
        const columnWidth = this.fontEm.width * 8;

        const visibleRows = Math.floor(this.canvas.height / fontHeight) - 1; // subtract one for the fixed heading
        const totalRows = maxSequencerLength;
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

            let x = 0;
            if (rowColor) {
                ctx.fillStyle = rowColor
                ctx.fillRect(x, (i + 1) * fontHeight, this.canvas.width - x, fontHeight)
            }

            ctx.fillStyle = "#FFF";
            ctx.fillText(rowNumber.toString(), x + rowNumberWidth - this.fontEm.width, (i + 1) * fontHeight + this.fontEm.fontBoundingBoxAscent);
        }

        ctx.textAlign = "left";

        for (let i = 0; i < this.app.song.sequenceColumns.length; i++) {
            const sequenceColumn = this.app.song.sequenceColumns[i];
            const sequenceX = rowNumberWidth + i * columnWidth;

            ctx.strokeStyle = "#000";
            ctx.beginPath();
            ctx.moveTo(sequenceX + columnWidth, 0);
            ctx.lineTo(sequenceX + columnWidth, this.canvas.height);
            ctx.stroke();

            ctx.fillText(sequenceColumn.instrument.name, sequenceX, this.fontEm.fontBoundingBoxAscent);

            for (let sequenceEvent of sequenceColumn.events) {
                const pattern = sequenceEvent.pattern;

                const patternBeats = pattern.duration / pattern.subdivision;

                ctx.fillStyle = "#444";
                ctx.fillRect(sequenceX, (sequenceEvent.time - this.scrollRow) * fontHeight + fontHeight, columnWidth - 1, patternBeats * fontHeight);
                ctx.fillStyle = "#FFF";
                ctx.fillText(pattern.name, sequenceX, (sequenceEvent.time - this.scrollRow) * fontHeight + fontHeight + this.fontEm.fontBoundingBoxAscent)
            }
        }

        // Cursor
        ctx.fillStyle = "#FFF";
        const ori = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "difference";
        ctx.fillRect(rowNumberWidth + this.cursorColumn * columnWidth, (this.cursorTime - this.scrollRow) * fontHeight + fontHeight, columnWidth - 1, fontHeight)
        ctx.globalCompositeOperation = ori;

        // Selection
        if (this.selection) {
            const ori = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = "difference";

            let x = rowNumberWidth;
            const x1 = Math.min(this.selection.startColumn, this.selection.endColumn) * columnWidth;
            const x2 = (Math.max(this.selection.startColumn, this.selection.endColumn) + 1) * columnWidth;

            let y1 = (Math.min(this.selection.startRow, this.selection.endRow) - this.scrollRow) * fontHeight;
            let y2 = (Math.max(this.selection.startRow, this.selection.endRow) - this.scrollRow + 1) * fontHeight;

            ctx.fillStyle = "#444";
            ctx.fillStyle = "#DDD";
            ctx.fillRect(x + x1, fontHeight + y1, (x2 - x1), y2 - y1);

            ctx.globalCompositeOperation = ori;
        }

        // play position
        const playPos = this.app.player?. currentBeat??0;

        ctx.strokeStyle = "#FFF";
        ctx.beginPath();
        ctx.moveTo(0, playPos * fontHeight);
        ctx.lineTo(this.canvas.width, playPos * fontHeight);
        ctx.stroke();

        // loop start
        const loopStartPos = this.app.song.loopStart;
        ctx.strokeStyle = "#F44";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, loopStartPos * fontHeight);
        ctx.lineTo(this.canvas.width, loopStartPos * fontHeight);
        ctx.stroke();

        // loop end
        const loopEndPos = this.app.song.loopEnd;
        ctx.strokeStyle = "#F44 3px";
        ctx.beginPath();
        ctx.moveTo(0, loopEndPos * fontHeight);
        ctx.lineTo(this.canvas.width, loopEndPos * fontHeight);
        ctx.stroke();

        ctx.lineWidth = 1;

        // scroll
        ctx.fillStyle = "#333";
        ctx.fillRect(this.canvas.width - 20, 0, 20, this.canvas.height)

        const scrollbarHeight = Math.floor((visibleRows / totalRows) * this.canvas.height);
        const scrollbarPosition = Math.floor((this.scrollRow / totalRows) * this.canvas.height);

        ctx.fillStyle = "#AAA";
        ctx.fillRect(this.canvas.width - 20, scrollbarPosition, 20, scrollbarHeight);
    }

    getDomNode() {
        return this.container;
    }
} 
