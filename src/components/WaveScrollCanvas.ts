/*

shift+drag anywhere = select  (in both views??)
drag selection range edge = extend selection (in both views??)
shift+drag selection range = shift selection (in both views??)

drag zoom range = shift zoom
drag zoom range edge = extend zoom

*/
// import { resizeCanvas } from "../FlexCanvasHelper";
import { WaveRange } from "../audio/SongDocument";
import { convertRemToPixels, drawWaveBuffer, drawWaveRange, getHeightPerChannel, samplePositionFromPixel } from "../audio/WaveCanvasUtil";
import { DragTarget, IComponent, PointType, ptInRect, RectType } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";

class DragSelect extends DragTarget {
    component: WaveScrollCanvas;
    start: number;
    end: number;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super();

        this.component = component;
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
    }

    move(e: PointerEvent) {
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
        this.component.setSelection(this.start, this.end)
        this.component.dispatchEvent(new CustomEvent("selchange"));
    }

    up(e: PointerEvent) {

    }
}

class DragZoomArea extends DragTarget {
    component: WaveScrollCanvas;
    start: number;
    end: number;
    startZoom: WaveRange;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super();

        if (!component.zoom) {
            throw new Error("Cannot drag zoom if not set");
        }

        this.component = component;
        this.startZoom = { ... this.component.zoom };
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
    }

    move(e: PointerEvent) {
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);

        let dist = this.end - this.start;

        if (this.startZoom.start + dist < 0) {
            dist = -this.startZoom.start;
        }

        if (this.startZoom.end + dist >= this.component.buffers[0].length) {
            dist = this.component.buffers[0].length - this.startZoom.end;
        }

        this.component.setZoom(this.startZoom.start + dist, this.startZoom.end + dist);
        this.component.dispatchEvent(new CustomEvent("zoomchange"));
    }

    up(e: PointerEvent) {
    }
}

class DragZoomLeft extends DragTarget {
    component: WaveScrollCanvas;
    start: number;
    end: number;
    startZoom: WaveRange;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super();

        if (!component.zoom) {
            throw new Error("Cannot drag zoom if not set");
        }

        this.component = component;
        this.startZoom = { ... this.component.zoom };
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
    }

    move(e: PointerEvent) {
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);

        let dist = this.end - this.start;

        if (this.startZoom.start + dist < 0) {
            dist = -this.startZoom.start;
        }

        if (this.startZoom.end + dist >= this.component.buffers[0].length) {
            dist = this.component.buffers[0].length - this.startZoom.end;
        }

        this.component.setZoom(this.startZoom.start + dist, this.startZoom.end);
        this.component.dispatchEvent(new CustomEvent("zoomchange"));
    }

    up(e: PointerEvent) {
    }
}

class DragZoomRight extends DragTarget {
    component: WaveScrollCanvas;
    start: number;
    end: number;
    startZoom: WaveRange;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super();

        if (!component.zoom) {
            throw new Error("Cannot drag zoom if not set");
        }

        this.component = component;
        this.startZoom = { ... this.component.zoom };
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
    }

    move(e: PointerEvent) {
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);

        let dist = this.end - this.start;

        if (this.startZoom.start + dist < 0) {
            dist = -this.startZoom.start;
        }

        if (this.startZoom.end + dist >= this.component.buffers[0].length) {
            dist = this.component.buffers[0].length - this.startZoom.end;
        }

        this.component.setZoom(this.startZoom.start, this.startZoom.end + dist);
        this.component.dispatchEvent(new CustomEvent("zoomchange"));
    }

    up(e: PointerEvent) {
    }
}

export class WaveScrollCanvas extends EventTarget implements IComponent {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    overlayCanvas: HTMLCanvasElement;

    buffers: Float32Array[] = [new Float32Array(0)];
    selection?: WaveRange;
    zoom?: WaveRange;
    playPosition: number;

    dragTarget: DragTarget | null = null;
    zoomRect: RectType | null = null;
    beginZoom: WaveRange | null = null;
    zoomHandleLeftRect: RectType | null = null;
    zoomHandleRightRect: RectType | null = null;

    constructor() {
        super();
        this.container = document.createElement("div");
        this.container.classList.add("h-32", "w-full", "pb-1", "relative");

        this.canvas = FlexCanvas();
        this.canvas.classList.add("rounded-lg", "touch-none", "absolute", "w-full", "h-full"); // touch-none class fixes pointermove

        this.container.addEventListener("pointerdown", this.onMouseDown);
        this.container.addEventListener("pointerup", this.onMouseUp);
        this.container.addEventListener("pointermove", this.onMouseMove);
        // this.canvas.addEventListener("contextmenu", this.onContextMenu);
        // this.canvas.addEventListener("keydown", this.onKeyDown);
        this.canvas.addEventListener("resize", this.onResize);

        this.overlayCanvas = FlexCanvas();
        this.overlayCanvas.classList.add("rounded-lg", "touch-none", "absolute", "w-full", "h-full"); // touch-none class fixes pointermove
        this.overlayCanvas.style.mixBlendMode = "difference"; 

        this.overlayCanvas.addEventListener("resize", this.onResizeOverlay);

        this.container.appendChild(this.canvas);
        this.container.appendChild(this.overlayCanvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async () => {
    };

    onUnmounted = async () => {
    };

    onResize = async () => {
        this.updateRects();
        this.redrawCanvas();
    };

    onResizeOverlay = async () => {
        this.updateRects();
        this.redrawOverlayCanvas();
    };

    onMouseDown = (e: PointerEvent) => {
        if (!this.dragTarget) {
            if (e.shiftKey) {
                this.dragTarget = new DragSelect(this, e);
            } else {
                const pt: PointType = [ e.offsetX, e.offsetY ];

                if (this.zoomRect && ptInRect(pt, this.zoomRect)) {
                    this.dragTarget = new DragZoomArea(this, e);
                } else if (this.zoomHandleLeftRect && ptInRect(pt, this.zoomHandleLeftRect)) { 
                    this.dragTarget = new DragZoomLeft(this, e);
                } else if (this.zoomHandleRightRect && ptInRect(pt, this.zoomHandleRightRect)) { 
                    this.dragTarget = new DragZoomRight(this, e);
                } else {
                    // scroll to this position, then enter dragZoom?
                    // her skal vi dragge et zoom-area
                    return;
                }
            }

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
        if (this.zoomRect && ptInRect([e.offsetX, e.offsetY], this.zoomRect)) {
            this.canvas.style.cursor = "move";
        } else if (this.zoomHandleLeftRect && ptInRect([e.offsetX, e.offsetY], this.zoomHandleLeftRect)) { 
            this.canvas.style.cursor = "ew-resize";
        } else if (this.zoomHandleRightRect && ptInRect([e.offsetX, e.offsetY], this.zoomHandleRightRect)) { 
            this.canvas.style.cursor = "ew-resize";
        } else {
            this.canvas.style.cursor = "default";
        }

        if (!this.dragTarget) {
            return;
        }

        this.dragTarget.move(e);
        return;
    };

    updateRects() {
        // rects where mouse cursor changes and can drag
        if (this.zoom) {
            const zoom = this.zoom;

            const zoomStart = zoom ? zoom.start : 0;
            const zoomEnd = zoom ? zoom.end : this.buffers[0].length;
            const zoomWidth = zoomEnd - zoomStart;

            // const deltaX = zoomWidth / this.canvas.width;
            const bufferLength = this.buffers[0].length;
            console.log("ZOOM OF ", zoomWidth, this.canvas.width, zoomStart, zoomEnd)

            this.zoomRect = [
                zoomStart / bufferLength * this.canvas.width + 2,
                0,
                zoomEnd / bufferLength * this.canvas.width - 2,
                this.canvas.height 
            ];

            this.zoomHandleLeftRect = [
                zoomStart / bufferLength * this.canvas.width - 2,
                0,
                zoomStart / bufferLength * this.canvas.width + 2,
                this.canvas.height
            ];

            this.zoomHandleRightRect = [
                zoomEnd / bufferLength * this.canvas.width - 2,
                0,
                zoomEnd / bufferLength * this.canvas.width + 2,
                this.canvas.height
            ];
        } else {
            this.zoomRect = null;
            this.zoomHandleLeftRect = null;
            this.zoomHandleRightRect = null;
        }
    }

    clear() {
        this.clearSelection();
        this.zoom = null;
        this.buffers = [new Float32Array(0)];
        this.redrawOverlayCanvas();
    }

    setSelection(start: number, end: number) {
        if (this.selection && this.selection.start === start && this.selection.end === end) {
            return;
        }

        this.selection = { start, end };
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

        this.zoom = { start, end };
        this.updateRects();
        this.redrawOverlayCanvas();
    }

    clearZoom() {
        if (!this.zoom) {
            return;
        }

        this.zoom = null;
        this.updateRects();
        this.redrawOverlayCanvas();
    }

    redrawCanvas() {
        const ctx = this.canvas.getContext("2d");

        const channelMargin = convertRemToPixels(0.25); // p-1 is used for inset/outset spacing, which is 0.25rem
        const channelHeight = getHeightPerChannel(this.canvas, this.buffers.length, channelMargin);

        for (let i = 0; i < this.buffers.length; i++) {
            drawWaveBuffer(ctx, 0, channelMargin * i + channelHeight * i, this.canvas.width, channelHeight, null, this.buffers[i], "#112", "#fff");
        }
    }

    redrawOverlayCanvas() {
        const ctx = this.overlayCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        const channelMargin = convertRemToPixels(0.25); // p-1 is used for inset/outset spacing, which is 0.25rem
        const channelHeight = getHeightPerChannel(this.canvas, this.buffers.length, channelMargin);

        for (let i = 0; i < this.buffers.length; i++) {

            const y = channelMargin * i + channelHeight * i;

            if (this.zoom)
                drawWaveRange(ctx, 0, y, this.overlayCanvas.width, channelHeight, null, this.zoom, this.buffers[i].length, "#333");

            if (this.selection) {
                const start = Math.min(this.selection.start, this.selection.end);
                const end = Math.max(this.selection.start, this.selection.end);

                drawWaveRange(ctx, 0, y, this.overlayCanvas.width, channelHeight, null, {start,end}, this.buffers[i].length, "#FFF");
            }

            // draw draggable handles

            // draw play position
            const playX = (this.playPosition) / this.buffers[i].length * this.overlayCanvas.width;
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
