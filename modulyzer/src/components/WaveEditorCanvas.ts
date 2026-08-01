import { WaveRange } from "../audio/SongDocument";
import { convertRemToPixels, drawWaveBuffer, drawWaveRange, getHeightPerChannel, samplePositionFromPixel  } from "../audio/WaveCanvasUtil";
import { DragTarget, IComponent } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";

class DragSelect extends DragTarget {
    component: WaveEditorCanvas;
    start: number;
    end: number;
    moved: boolean = false;

    constructor(component: WaveEditorCanvas, e: PointerEvent) {
        super();

        this.component = component;
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, this.component.zoom, this.component.buffers[0].length);
    }

    move(e: PointerEvent) {
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, this.component.zoom, this.component.buffers[0].length);

        if (this.end < 0) {
            this.end = 0;
        }

        if (this.end >= this.component.buffers[0].length) {
            this.end = this.component.buffers[0].length - 1;
        }

        this.moved = true;
        this.component.setSelection(this.start, this.end);
        this.component.dispatchEvent(new CustomEvent("selchange"));
    }

    up(e: PointerEvent) {
        if (!this.moved) {
            this.component.clearSelection();
            this.component.dispatchEvent(new CustomEvent("selchange"));
        }
    }
}

export class WaveEditorCanvas extends EventTarget implements IComponent {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    overlayCanvas: HTMLCanvasElement;

    buffers: Float32Array[] = [new Float32Array(0)];
    selection?: WaveRange;
    zoom?: WaveRange;
    playPosition: number;
    dragTarget: DragTarget | null = null;

    constructor() {
        super();
        this.container = document.createElement("div");
        this.container.classList.add("flex-1", "w-full", "pb-1", "relative");

        this.canvas = FlexCanvas();
        this.canvas.classList.add("rounded-lg", "touch-none", "absolute", "w-full", "h-full"); // touch-none class fixes pointermove

        this.container.addEventListener("pointerdown", this.onMouseDown);
        this.container.addEventListener("pointerup", this.onMouseUp);
        this.container.addEventListener("pointermove", this.onMouseMove);
        this.container.addEventListener("contextmenu", this.onContextMenu);

        this.canvas.addEventListener("resize", this.onResize);
        // this.canvas.addEventListener("keydown", this.onKeyDown);

        this.overlayCanvas = FlexCanvas();
        this.overlayCanvas.classList.add("rounded-lg", "touch-none", "absolute", "w-full", "h-full"); // touch-none class fixes pointermove
        this.overlayCanvas.style.mixBlendMode = "difference"; 

        this.overlayCanvas.addEventListener("resize", this.onResizeOverlay);

        this.container.appendChild(this.canvas);
        this.container.appendChild(this.overlayCanvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
    };

    onUnmounted = () => {
    };

    onResize = () => {
        this.redrawCanvas();
    };

    onResizeOverlay = () => {
        this.redrawOverlayCanvas();
    };

    onMouseDown = (e: PointerEvent) => {
        if (!this.dragTarget) {
            this.clearSelection();

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
        // app has the menu container and prop
        // dispatch whole menu and pos
        // injct app thing - tis can b t sam mnu as mnubar -> dit -> fx
        // app tisn; contxtmnu and actions and windows
        console.log("onContextMenu")
        // this.model.contextmenu(e)
        e.preventDefault();
    };

    clear() {
        this.buffers = [new Float32Array(0)];
        this.clearSelection();
        this.clearZoom();
    }

    setSelection(start: number, end: number) {
        if (this.selection && this.selection.start === start && this.selection.end === end) {
            return;
        }

        this.selection = { start, end };

        console.log(this.selection)
        this.redrawOverlayCanvas();
    }

    clearSelection() {
        if (!this.selection) {
            return;
        }

        this.selection = null;
        this.redrawOverlayCanvas();
    }

    setZoom(start: number, end: number) {
        if (this.zoom && this.zoom.start === start && this.zoom.end === end) {
            return;
        }

        console.log("edit: zoom")
        this.zoom = { start, end };
        this.redrawCanvas();
        this.redrawOverlayCanvas();
    }

    clearZoom() {
        if (!this.zoom) {
            return;
        }

        this.zoom = null;
        this.redrawCanvas();
        this.redrawOverlayCanvas();
    }

    redrawCanvas() {
        const ctx = this.canvas.getContext("2d");
        const channelMargin = convertRemToPixels(0.25); // p-1 is used for inset/outset spacing, which is 0.25rem
        const channelHeight = getHeightPerChannel(this.canvas, this.buffers.length, channelMargin);
        for (let i = 0; i < this.buffers.length; i++) {
            drawWaveBuffer(ctx, 0, channelMargin * i + channelHeight * i, this.canvas.width, channelHeight, this.zoom, this.buffers[i], "#000", "#fff");
        }
    }

    redrawOverlayCanvas() {
        const ctx = this.overlayCanvas.getContext("2d");

        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        // Need height space for scrollbar, and time maarkers - want "full wave preview with timestamps, dragable-zoom-range-handles and scroll"
        const channelMargin = convertRemToPixels(0.25); // p-1 is used for inset/outset spacing, which is 0.25rem
        const channelHeight = getHeightPerChannel(this.canvas, this.buffers.length, channelMargin);

        for (let i = 0; i < this.buffers.length; i++) {

            const y = channelMargin * i + channelHeight * i;
            if (this.selection) {
                const start = Math.min(this.selection.start, this.selection.end);
                const end = Math.max(this.selection.start, this.selection.end);
        
                drawWaveRange(ctx, 0, y, this.overlayCanvas.width, channelHeight, this.zoom, {start, end}, this.buffers[i].length, "#FFF");
            }

            const zoomStart = this.zoom ? this.zoom.start : 0;
            const zoomEnd = this.zoom ? this.zoom.end : this.buffers[0].length;
            const zoomWidth = zoomEnd - zoomStart;

            // draw play position
            const playX = (this.playPosition - zoomStart) / zoomWidth * this.overlayCanvas.width;
            ctx.strokeStyle = "#0F0"
            ctx.beginPath();
            ctx.moveTo(playX, y);
            ctx.lineTo(playX, y + channelHeight);
            ctx.stroke();
        }
    }

    getDomNode(): Node {
        return this.container;
    }
} 
