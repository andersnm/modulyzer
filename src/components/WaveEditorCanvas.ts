import { WaveRange } from "../audio/SongDocument";
import { convertRemToPixels, drawWaveBuffer, drawWaveRange, samplePositionFromPixel  } from "../audio/WaveCanvasUtil";
import { DragTarget, IComponent, INotify } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";

class DragSelect extends DragTarget {
    component: WaveEditorCanvas;
    start: number;
    end: number;

    constructor(component: WaveEditorCanvas, e: PointerEvent) {
        super();

        this.component = component;
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, this.component.zoom, this.component.buffers[0].length);
    }

    move(e: PointerEvent) {
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, this.component.zoom, this.component.buffers[0].length);
        this.component.setSelection(this.start, this.end)
    }

    up(e: PointerEvent) {

    }
}

export class WaveEditorCanvas implements IComponent {
    parent: INotify;
    container: HTMLElement;
    canvas: HTMLCanvasElement;

    buffers: Float32Array[] = [new Float32Array(0)];
    selection?: WaveRange;
    zoom?: WaveRange;
    playPosition: number;
    dragTarget: DragTarget | null = null;

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
        this.canvas.addEventListener("contextmenu", this.onContextMenu);

        this.canvas.addEventListener("resize", this.onResize);
        // this.canvas.addEventListener("keydown", this.onKeyDown);
        
        this.container.appendChild(this.canvas);

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

        console.log("edit: zoom")
        this.zoom = { start, end };
        this.parent.notify(this, "zoomchange");
        this.redrawCanvas();
    }

    clearZoom() {
        if (!this.zoom) {
            return;
        }

        this.zoom = null;
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
        for (let i = 0; i < channelCount; i++) {
            drawWaveBuffer(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, this.zoom, this.playPosition, this.buffers[i], "#000", "#fff");

            if (this.selection) {
                const start = Math.min(this.selection.start, this.selection.end);
                const end = Math.max(this.selection.start, this.selection.end);
        
                drawWaveRange(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, this.zoom, {start, end}, this.buffers[i].length, "#FFF");
            }
        }
    }

    getDomNode(): Node {
        return this.container;
    }
} 
