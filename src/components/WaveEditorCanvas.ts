import { WaveRange } from "../audio/SongDocument";
import { convertRemToPixels, drawWaveBuffer, drawWaveRange, samplePositionFromPixel } from "../audio/WaveCanvasUtil";
import { IComponent, INotify } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";

export class WaveEditorCanvas implements IComponent {
    parent: INotify;
    container: HTMLElement;
    canvas: HTMLCanvasElement;

    buffers: Float32Array[] = [new Float32Array(0)];
    selection?: WaveRange;
    zoom?: WaveRange;
    playPosition: number;
    mouseDown: boolean = false;
    selectionStart: number = 0;
    selectionEnd: number = 0;

    constructor(parent: INotify) {
        this.parent = parent;
        this.container = document.createElement("div");
        this.container.className = "flex-1 w-full pb-1";
        
        this.canvas = FlexCanvas(); // document.createElement("canvas");
        this.canvas.className = "rounded-lg";
        this.canvas.tabIndex = 0;

        this.canvas.addEventListener("pointerdown", this.onMouseDown);
        this.canvas.addEventListener("pointerup", this.onMouseUp);
        this.canvas.addEventListener("pointermove", this.onMouseMove);
        this.canvas.addEventListener("contextmenu", this.onContextMenu);

        this.canvas.addEventListener("resize", this.onResize);
        // this.canvas.addEventListener("keydown", this.onKeyDown);
        
        this.container.appendChild(this.canvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        console.log("MOUTNED WE")

        // window.addEventListener("resize", this.onResize)
        // this.onResize();
    };

    onUnmounted = () => {
        // window.removeEventListener("resize", this.onResize)
    };

    onResize = () => {
        // console.log("W!!window resize");
        this.redrawCanvas();
    };

    onMouseDown = (e: MouseEvent) => {
        // TODO; POINTER EVENTS INSTEAD?? setPointerCapture
        console.log("ITS A DOWN")

        if (!this.mouseDown) {
            if (this.selectionStart !== this.selectionEnd) {
                // clear selection
                // this.dispatch(this.props, "select", null);
            }

            this.mouseDown = true;
            this.selectionStart = samplePositionFromPixel(this.canvas, e.offsetX, this.zoom, this.buffers[0].length);

            this.redrawCanvas();
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

        // set new selection -> canvas px to samplePos
        // const n = e.offsetX / this.canvas.width;
        // const samplePosition = Math.floor(n * this.props.recordingBuffer.length);
        this.selectionEnd = samplePositionFromPixel(this.canvas, e.offsetX, this.zoom, this.buffers[0].length);

        // const selection = {
        //     start: Math.min(this.selectionStart, this.selectionEnd),
        //     end: Math.max(this.selectionStart, this.selectionEnd),
        // };

        console.log("ITS A MOV", this.selectionStart, this.selectionEnd)
        
        this.parent.notify(this, "selchange");

        this.redrawCanvas();

        // this.props.selection = {
        //     start: Math.min(this.selectionStart, this.selectionEnd),
        //     end: Math.max(this.selectionStart, this.selectionEnd),
        // };

        // should react to selection? dispatch selection changed
        // this.dispatch(this.props, "select", selection)

        // console.log(e.offsetX, e.offsetY, "SAMPLEPOS", samplePosition )
    };

    onContextMenu = (e: MouseEvent) => {
        // app has the menu container and prop
        // dispatch whole menu and pos
        // injct app thing - tis can b t sam mnu as mnubar -> dit -> fx
        // app tisn; contxtmnu and actions and windows
        console.log("onContextMenu")
        // this.model.contextmenu(e)
        e.preventDefault();
    };

    setSelection(start, end) {
        
    }

    redrawCanvas() {
        // if (!this.props) return;

        console.log("REDRAW")
        // need to lookup component from -- canvas dom?? and then call this, it gets nasty
        // console.log("HELLO REDRAW REQUESTED", this.props.recordingBuffer)
        const ctx = this.canvas.getContext("2d");

        // Need height space for scrollbar, and time maarkers - want "full wave preview with timestamps, dragable-zoom-range-handles and scroll"
        const channelCount = this.buffers.length;
        const channelMargin = convertRemToPixels(0.25); // p-1 is used for inset/outset spacing, which is 0.25rem

        let h: number; // height per channel in the editor

        if (channelCount > 1) {
            h = (this.canvas.height - ((channelCount - 1) * channelMargin)) / channelCount;
        } else {
            h = this.canvas.height;
        }

        // marg mellom channels; neutral-800 bar, height 0,25rem

        const start = Math.min(this.selectionStart, this.selectionEnd);
        const end = Math.max(this.selectionStart, this.selectionEnd);

        for (let i = 0; i < channelCount; i++) {
            console.log("REDRAW-X", i)
            drawWaveBuffer(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, this.zoom, this.playPosition, this.buffers[i], "#000", "#fff");

            if (start && end)
                drawWaveRange(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, this.zoom, {start, end}, this.buffers[i].length, "#FFF");

        }

        // // will do a separate WaveScrollCanvas, WaveEditCanvas
        // for (let i = 0; i < channelCount; i++) {
        //     this.drawBuffer(ctx, 0, editorHeight + channelMargin + sh * i, this.canvas.width, sh, null, this.props.buffers[0]);
        // }

    }

    getDomNode(): Node {
        return this.container;
    }
} 
