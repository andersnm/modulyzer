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
import { IComponent } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";

type RectType = [number, number, number, number];
type PointType = [number, number];

function ptInRect(pt: PointType, rect: RectType) {
    const [ x, y ] = pt;
    const [ left, top, right, bottom ] = rect;
    return x >= left && x < right && y >= top && y < bottom;
}

abstract class DragTarget {
    // action: string;
    component: WaveScrollCanvas;
    start: number;
    end: number;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        this.component = component;
        this.start = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);
    }

    abstract move(e);
    abstract up(e);
}

class DragSelect extends DragTarget {
    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super(component, e);

        this.component.dispatch(this.component, "select", null);
    }

    move(e: PointerEvent) {
        // when dragging starts, should have some kind of abstraction
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);

        // this.selectionEnd = samplePositionFromPixel(this.canvas, e.offsetX, null, this.props.buffers[0].length);

        const selection = {
            start: Math.min(this.start, this.end),
            end: Math.max(this.start, this.end),
        };

        this.component.dispatch(this.component, "select", selection);
    }

    up(e: PointerEvent) {

    }
}

class DragZoomArea extends DragTarget {
    // action = "dragZoom";
    startZoom: WaveRange;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super(component, e);

        if (!this.component.zoom) {
            throw new Error("Cannot drag zoom if not set");
        }

        this.startZoom = { ... this.component.zoom };
    }

    move(e: PointerEvent) {
        // when dragging starts, should have some kind of abstraction
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);

        let dist = this.end - this.start;

        if (this.startZoom.start + dist < 0) {
            dist = -this.startZoom.start;
        }

        if (this.startZoom.end + dist >= this.component.buffers[0].length) {
            dist = this.component.buffers[0].length - this.startZoom.end;
        }

        const zoom = {
            start: this.startZoom.start + dist,
            end: this.startZoom.end + dist,
        };

        this.component.dispatch(this.component, "onZoom", zoom);
    }

    up(e: PointerEvent) {
    }
}

class DragZoomLeft extends DragTarget {
    startZoom: WaveRange;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super(component, e);

        if (!this.component.zoom) {
            throw new Error("Cannot drag zoom if not set");
        }

        this.startZoom = { ... this.component.zoom };
    }

    move(e: PointerEvent) {
        // when dragging starts, should have some kind of abstraction
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);

        let dist = this.end - this.start;

        // ny zoom er mellom startZoom end og end

        const zoom = {
            start: Math.min(this.startZoom.end, this.end),
            end: Math.max(this.startZoom.end, this.end),
            // end: this.startZoom.end + dist,
        };
        this.component.dispatch(this.component, "onZoom", zoom);
    }

    up(e: PointerEvent) {
    }
}

class DragZoomRight extends DragTarget {
    startZoom: WaveRange;

    constructor(component: WaveScrollCanvas, e: PointerEvent) {
        super(component, e);

        if (!this.component.zoom) {
            throw new Error("Cannot drag zoom if not set");
        }

        this.startZoom = { ... this.component.zoom };
    }

    move(e: PointerEvent) {
        // when dragging starts, should have some kind of abstraction
        this.end = samplePositionFromPixel(this.component.canvas, e.offsetX, null, this.component.buffers[0].length);

        let dist = this.end - this.start;

        // ny zoom er mellom startZoom start og end

        const zoom = {
            start: Math.min(this.startZoom.start, this.end),
            end: Math.max(this.startZoom.start, this.end),
            // end: this.startZoom.end + dist,
        };

        this.component.dispatch(this.component, "onZoom", zoom);
    }

    up(e: PointerEvent) {
    }
}

export class WaveScrollCanvas implements IComponent {
    container: HTMLElement;
    canvas: HTMLCanvasElement;

    buffers: Float32Array[] = [new Float32Array(0)];
    selection?: WaveRange;
    zoom?: WaveRange;
    playPosition: number;

    // mouseDown: boolean = false;
    // mouseAction: string = null;
    // selectionStart: number = 0;
    // selectionEnd: number = 0;

    dragTarget: DragTarget | null = null;
    // mouseBeginDragPoint: PointType | null = null;
    zoomRect: RectType | null = null;
    beginZoom: WaveRange | null = null;
    zoomHandleLeftRect: RectType | null = null;
    zoomHandleRightRect: RectType | null = null;

    constructor() {
        this.container = document.createElement("div");
        this.container.className = "flex-1 w-full pb-1";
        
        this.canvas = FlexCanvas(); // document.createElement("canvas");
        this.canvas.className = "rounded-lg";
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

    dispatch(...args: any[]) {
        console.log("DISOATCH SCROL")
    }

    onMounted = async () => {
        console.log("MOUTNED WS")
        // window.addEventListener("resize", this.onResize)
        // this.onResize();
    };

    onUnmounted = async () => {
        // window.removeEventListener("resize", this.onResize)
    };

    onResize = async () => {
        console.log("Swindow resize");
        // should hide the canvas, let reflow, measure container, resize the canvas and show again, possibly 0x0 it inbetween
        // await resizeCanvas(this.canvas);
        this.updateRects();
        this.redrawCanvas();
    };

    onMouseDown = (e: PointerEvent) => {
        console.log("ITS A DOWN")

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

            // this.mouseDown = true;
            this.canvas.setPointerCapture(e.pointerId);
        }
    };

    onMouseUp = (e: PointerEvent) => {
        // TODO; POINTER EVENTS INSTEAD?? setPointerCapture
        if (!this.dragTarget) {
            return;
        }

        this.canvas.releasePointerCapture(e.pointerId);
        this.dragTarget.up(e);
        this.dragTarget = null;

        // this.mouseDown = false;
        // emit selection changed, if changed
    };

    onMouseMove = (e: MouseEvent) => {
        // TODO; POINTER EVENTS INSTEAD?? setPointerCapture

        if (this.zoomRect && ptInRect([e.offsetX, e.offsetY], this.zoomRect)) {
            console.log("WE MOVE MOSE AAND ITS IN RECT")
            this.canvas.style.cursor = "move";
        } else if (this.zoomHandleLeftRect && ptInRect([e.offsetX, e.offsetY], this.zoomHandleLeftRect)) { 
            console.log("LEFT RECT")
            this.canvas.style.cursor = "ew-resize";
        } else if (this.zoomHandleRightRect && ptInRect([e.offsetX, e.offsetY], this.zoomHandleRightRect)) { 
            console.log("RIGHT RECT")
            this.canvas.style.cursor = "ew-resize";
        } else {
            this.canvas.style.cursor = "default";
        }

        // if mouse is over the start/end handles of either the zoom or selection->
        // can draw handles on top/bottom, w opposing colors and drag-position

        // if (!this.mouseDown) {
        //     return;
        // }

        if (!this.dragTarget) {
            return;
        }

        // shift+drag = select

        this.dragTarget.move(e);
        return;

        // if (this.mouseAction === "dragZoom") {
        //     // when dragging starts, should have some kind of abstraction
        //     this.selectionEnd = samplePositionFromPixel(this.canvas, e.offsetX, null, this.props.buffers[0].length);

        //     const dist = this.selectionEnd - this.selectionStart;

        //     const zoom = {
        //         start: this.beginZoom.start + dist,
        //         end: this.beginZoom.end + dist,
        //     };

        //     this.dispatch(this.props, "onZoom", zoom);
        // }
        // else if (this.mouseAction === "select") {
        //     this.selectionEnd = samplePositionFromPixel(this.canvas, e.offsetX, null, this.props.buffers[0].length);

        //     const selection = {
        //         start: Math.min(this.selectionStart, this.selectionEnd),
        //         end: Math.max(this.selectionStart, this.selectionEnd),
        //     };

        //     this.dispatch(this.props, "select", selection);
        // }
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
    
        console.log("ZOOM RECT IS", this.zoomRect)
    }

    // async mounted(platform, el: Node) {

    //     el = el.nextSibling; // hack!

    //     if (!(el instanceof HTMLElement)) {
    //         throw new Error("Unexpected canvas host");
    //     }

    //     this.canvas = el.querySelector("canvas");

    //     window.addEventListener("resize", this.onResize)

    //     // this.canvas.addEventListener("mousedown", this.onMouseDown) // WAIT!
    //     await resizeCanvas(this.canvas);
    //     this.updateRects();
    //     this.redrawCanvas();
    // }

    // unmounted() {
    //     window.removeEventListener("resize", this.onResize)
    // }

    setSelection(start, end) {
        this.selection = { start, end };
        this.redrawCanvas();
    }


    redrawCanvas() {
        console.log("SCP RNE")
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

        // TODO; print markers and time pos, toggle units time/pct/offset

        for (let i = 0; i < channelCount; i++) {
            // selection in some color, zoom in some color, 
            drawWaveBuffer(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, null, this.playPosition, this.buffers[0], "#112", "#fff");

            if (this.zoom)
                drawWaveRange(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, null, this.zoom, this.buffers[0].length, "#000");

            if (this.selection)
                drawWaveRange(ctx, 0, channelMargin * i + h * i, this.canvas.width, h, null, this.selection, this.buffers[0].length, "#FFF");

            // draw draggable handles
        }
    }

    getDomNode(): Node {
        return this.container;
    }

    // render() {
    //     // can we lookup the component for each target? may be slow to lookup?

    //     // go to root, then find props for looking at child nodes
    //     // root = app
    //     // const selectSample = (id: IDBValidKey) => {
    //     //     console.log("SAMPLE ID " + id);
    //     //     this.dispatch("select", id)
    //     // };

    //     this.watch(this.props, "buffers", async () => {
    //         this.redrawCanvas();
    //     });

    //     // yes, here is a difference from before! this worked automatically when ALL props were wired up
    //     // we need to evaluate selection, capture dependants, and then update it like an attribute 
    //     // obvious helper on its way
    //     this.watch(this.props, "selection", () => {
    //         this.redrawCanvas();
    //     });

    //     this.watch(this.props, "zoom", () => {
    //         this.updateRects();
    //         this.redrawCanvas();
    //     });

    //     this.watch(this.props, "playPosition", async () => {
    //         this.redrawCanvas();
    //     });
        

    //     // this is gonna need a resize thing, like the directoive - or a FlexChildCanvas

    //     // this.canvas = new NutzElement("canvas", {
    //     //     className: "rounded-lg",
    //     //     mousedown: this.onMouseDown,
    //     //     mouseup: this.onMouseUp,
    //     //     mousemove: this.onMouseMove,
    //     // });

    //     return [
    //         new NutzElement("div", {
    //             className: "h-24 w-full",
    //             content: () => [ 
    //                 new NutzElement("canvas", {
    //                     className: "rounded-lg",
    //                     // problem, is called after our mounted
    //                     // mounted: (el) => this.canvas = el as HTMLCanvasElement, // if need element ref, can get it from prop event? fires AFTER our mounted
    //                     pointerdown: e => this.onMouseDown(e),
    //                     pointerup: this.onMouseUp,
    //                     pointermove: this.onMouseMove,
    //                 }),
    //             ]
    //         })
    //     ];
    // }
} 
