import { Appl } from "../App";
import { IComponent } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { PatternPanel } from "./PatternPanel";

const maxSequencerLength = 1024;

export class SequenceEditorCanvas implements IComponent {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    mouseDown: boolean = false;
    selectionStart: number = 0;
    selectionEnd: number = 0;
    cursorColumn: number = 0;
    cursorTime: number = 0;
    redrawTimer: number = null;

    app: Appl;

    constructor(app: Appl) {
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

    onMouseDown = (e: MouseEvent) => {
        // TODO; POINTER EVENTS INSTEAD?? setPointerCapture
        // console.log("ITS A DOWN")

        if (!this.mouseDown) {
            if (this.selectionStart !== this.selectionEnd) {
                // clear selection
                // this.dispatch(this.props, "select", null);
            }

            this.mouseDown = true;
            // this.selectionStart = samplePositionFromPixel(this.canvas, e.offsetX, this.props.zoom, this.props.buffers[0].length);
        }
    };

    onMouseUp = (e: MouseEvent) => {
        // TODO; POINTER EVENTS INSTEAD?? setPointerCapture
        if (!this.mouseDown) {
            return;
        }

        this.mouseDown = false;
        // emit selection changed, if changed
    };

    onMouseMove = (e: MouseEvent) => {
        // TODO; POINTER EVENTS INSTEAD?? setPointerCapture
        if (!this.mouseDown) {
            return;
        }
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
            e.stopPropagation(); // dont run global handler
            e.preventDefault(); // dont do canvas default
            return;
        }
    };

    editKeyDown(e: KeyboardEvent) {
        // console.log("KEYPP", e.key)
        switch (e.key) {
            case "ArrowUp":
                // TODO; cursor in document
                if (this.cursorTime> 0) {
                    this.cursorTime--;
                    this.scrollIntoView();
                    this.redrawCanvas();
                    return true;
                }
                break;
            case "ArrowDown":
                // TODO: max sequencer length
                if (this.cursorTime < maxSequencerLength - 1) {
                    this.cursorTime++;
                    this.scrollIntoView();
                    this.redrawCanvas();
                    return true;
                }
                break;
            case "ArrowRight":
                this.cursorColumn++;
                this.redrawCanvas();
                return true;
            case "ArrowLeft":
                this.cursorColumn--;
                this.redrawCanvas();
                return true;
            case "PageUp":
                this.cursorTime = Math.max(this.cursorTime - 16, 0);
                this.scrollIntoView();
                this.redrawCanvas();
                return true;
            case "PageDown":
                this.cursorTime = Math.min(this.cursorTime + 16, maxSequencerLength - 1);
                this.scrollIntoView();
                this.redrawCanvas();
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
        const ctx = this.canvas.getContext("2d");
        ctx.font = "14px monospace";
        const em = ctx.measureText("M");
        const fontHeight = em.fontBoundingBoxAscent + em.fontBoundingBoxDescent;

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
            const panel = await this.app.executeCommand("show-pattern-editor") as PatternPanel;
            panel.setPattern(sequenceEvent.pattern);
        }
    }

    editPatternIndex(patternIndex: number) {
        const sequenceColumn = this.app.song.sequenceColumns[this.cursorColumn];
        const sequenceEvent = sequenceColumn.events.find(e => e.time === this.cursorTime);
        const pattern = this.app.song.patterns[patternIndex];

        if (!pattern) {
            return;
        }

        if (!sequenceEvent) {
            this.app.song.createSequenceEvent(sequenceColumn, this.cursorTime, pattern);
        } else {
            this.app.song.updateSequenceEvent(sequenceEvent, pattern);
        }
    }

    scrollRow = 0;

    redrawCanvas() {
        const ctx = this.canvas.getContext("2d");

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.font = "14px monospace";

        const em = ctx.measureText("M");
        const fontHeight = em.fontBoundingBoxAscent + em.fontBoundingBoxDescent;
        const rowNumberWidth = em.width * 5;
        const columnWidth = em.width * 8;

        const visibleRows = Math.floor(this.canvas.height / fontHeight);
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
                ctx.fillRect(x, (i + 0) * fontHeight, this.canvas.width - x, fontHeight)
            }

            ctx.fillStyle = "#FFF";
            ctx.fillText(rowNumber.toString(), x + rowNumberWidth - em.width, (i + 0) * fontHeight + em.fontBoundingBoxAscent);
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

            for (let sequenceEvent of sequenceColumn.events) {
                const pattern = sequenceEvent.pattern;

                const patternBeats = pattern.duration / pattern.subdivision;

                ctx.fillStyle = "#444";
                ctx.fillRect(sequenceX, (sequenceEvent.time - this.scrollRow) * fontHeight, columnWidth - 1, patternBeats * fontHeight);
                ctx.fillStyle = "#FFF";
                ctx.fillText(pattern.name, sequenceX, (sequenceEvent.time - this.scrollRow) * fontHeight + em.fontBoundingBoxAscent)
            }
        }

        ctx.fillStyle = "#FFF";
        const ori = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "difference";
        ctx.fillRect(rowNumberWidth + this.cursorColumn * columnWidth, (this.cursorTime - this.scrollRow) * fontHeight, columnWidth - 1, fontHeight)
        ctx.globalCompositeOperation = ori;

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
