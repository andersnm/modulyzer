/*

shift+drag anywhere = select  (in both views??)
drag selection range edge = extend selection (in both views??)
shift+drag selection range = shift selection (in both views??)

drag zoom range = shift zoom
drag zoom range edge = extend zoom

*/
// import { resizeCanvas } from "../FlexCanvasHelper";
import { WaveRange } from "../audio/SongDocument";
import { convertRemToPixels, drawWaveBuffer, drawWaveRange, samplePositionFromPixel } from "../audio/WaveCanvasUtil";
import { IComponent, INotify } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";

type RectType = [number, number, number, number];
type PointType = [number, number];

function ptInRect(pt: PointType, rect: RectType) {
    const [ x, y ] = pt;
    const [ left, top, right, bottom ] = rect;
    return x >= left && x < right && y >= top && y < bottom;
}

abstract class DragTarget {
    constructor() {
    }

    abstract move(e);
    abstract up(e);
}

class DragSelect extends DragTarget {
    component: WaveScrollCanvas;
    start: number;
    end: number;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super();

        this.component = component;
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
        // this.component.clearSelection();
    }

    move(e: PointerEvent) {
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
        this.component.setSelection(this.start, this.end)
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
    }

    up(e: PointerEvent) {
    }
}

export class WaveScrollCanvas implements IComponent {
    parent: INotify;

    container: HTMLElement;
    canvas: HTMLCanvasElement;

    buffers: Float32Array[] = [new Float32Array(0)];
    selection?: WaveRange;
    zoom?: WaveRange;
    playPosition: number;

    dragTarget: DragTarget | null = null;
    zoomRect: RectType | null = null;
    beginZoom: WaveRange | null = null;
    zoomHandleLeftRect: RectType | null = null;
    zoomHandleRightRect: RectType | null = null;

    constructor(parent: INotify) {
        this.parent = parent;
        this.container = document.createElement("div");
        this.container.className = "flex-1 w-full pb-1";
        
        this.canvas = FlexCanvas();
        this.canvas.classList.add("rounded-lg");
        this.canvas.tabIndex = 0;

        this.canvas.addEventListener("pointerdown", this.onMouseDown);
        this.canvas.addEventListener("pointerup", this.onMouseUp);
        this.canvas.addEventListener("pointermove", this.onMouseMove);
        // this.canvas.addEventListener("contextmenu", this.onContextMenu);
        // this.canvas.addEventListener("keydown", this.onKeyDown);
        this.canvas.addEventListener("resize", this.onResize);

        this.container.appendChild(this.canvas);

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

    onMouseMove = (e: MouseEvent) => {
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


    setSelection(start: number, end: number) {
        if (this.selection && this.selection.start === start && this.selection.end === end) {
            return;
        }

        this.selection = { start, end };
        this.parent.notify(this, "selchange");
        this.redrawCanvas();
    }

    clearSelection() {
        if (!this.selection) {
            return;
        }

        this.selection = null;
        this.parent.notify(this, "selchange");
        this.redrawCanvas();
    }

    setZoom(start: number, end: number) {
        if (this.zoom && this.zoom.start === start && this.zoom.end === end) {
            return;
        }

        console.log("scroll: zoom")
        this.zoom = { start, end };
        this.updateRects();
        this.parent.notify(this, "zoomchange");
        this.redrawCanvas();
    }

    redrawCanvas() {
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

        // TODO; print markers and time pos, toggle units time/pct/offset

        for (let i = 0; i < channelCount; i++) {
            // selection in some color, zoom in some color, 
            drawWaveBuffer(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, null, this.playPosition, this.buffers[0], "#112", "#fff");

            if (this.zoom)
                drawWaveRange(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, null, this.zoom, this.buffers[0].length, "#000");

            if (this.selection) {
                const start = Math.min(this.selection.start, this.selection.end);
                const end = Math.max(this.selection.start, this.selection.end);

                drawWaveRange(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, null, {start,end}, this.buffers[0].length, "#FFF");
            }

            // draw draggable handles
        }
    }

    getDomNode(): Node {
        return this.container;
    }
} 
