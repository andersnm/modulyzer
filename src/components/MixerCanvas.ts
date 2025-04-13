import { DragTarget, IComponent, PointType, ptInRect, rectCenter, RectType } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { Appl } from "../App";
import { ConnectionDocument, InstrumentDocument } from "../audio/SongDocument";
import { PinsPanel } from "./PinsPanel";

const boxWidth = 100;
const boxHeight = 61; // 1.618
const arrowSize = 10;

class DragMove extends DragTarget {
    instrument: InstrumentDocument;
    relativePx: PointType;
    component: MixerCanvas;

    constructor(component: MixerCanvas, instrument: InstrumentDocument, e: PointerEvent) {
        super();

        this.component = component;
        this.instrument = instrument;
        const c = this.component.convertInstrumentToScreen([instrument.x, instrument.y]);
        this.relativePx = [ e.offsetX - c[0], e.offsetY - c[1] ];
    }

    move(e: PointerEvent) {
        // compute new centerpoint in pixels, relative to starting click position inside box
        const bokk: PointType = [ e.offsetX - this.relativePx[0], e.offsetY - this.relativePx[1] ];

        const pp = this.component.convertScreenToInstrument(bokk);
        this.instrument.x = pp[0];
        this.instrument.y = pp[1];
        this.component.redrawCanvas();
    }

    up(e: PointerEvent) {
        // actually commit to document, we just changed the value directly in the document (without notifying anybody)
        // this.component.app.song.updateInstrument(this.instrument);
    }
}

class DragConnect extends DragTarget {
    component: MixerCanvas;

    constructor(component: MixerCanvas, fromInstrument: InstrumentDocument, e: PointerEvent) {
        super();

        this.component = component;
        this.component.connectFromInstrument = fromInstrument;
        this.component.connectToPt = [e.offsetX, e.offsetY];
    }

    move(e: PointerEvent) {
        this.component.connectToPt = [e.offsetX, e.offsetY];
        this.component.redrawCanvas();
    }

    up(e: PointerEvent) {
        // actually commit to document, we just changed the value directly in the document (without notifying anybody)
        const connectToInstrument = this.component.instrumentAtPoint(e.offsetX, e.offsetY);

        if (connectToInstrument) {
            this.component.app.song.createConnection(this.component.connectFromInstrument, connectToInstrument);
        }

        this.component.connectFromInstrument = null;
        this.component.connectToPt = null;
    }
}

export class MixerCanvas implements IComponent {
    app: Appl;
    container: HTMLElement;
    canvas: HTMLCanvasElement;

    dragTarget: DragTarget | null = null;

    connectFromInstrument: InstrumentDocument;
    connectToPt: PointType;

    selectedInstrument: InstrumentDocument;
    selectedConnection: ConnectionDocument;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex-1 w-full pb-1";
        this.container.tabIndex = 0;
        
        this.canvas = FlexCanvas();
        this.canvas.classList.add("rounded-lg");

        this.canvas.addEventListener("pointerdown", this.onMouseDown);
        this.canvas.addEventListener("pointerup", this.onMouseUp);
        this.canvas.addEventListener("pointermove", this.onMouseMove);
        this.canvas.addEventListener("contextmenu", this.onContextMenu);
        this.canvas.addEventListener("dblclick", this.onDblClick);

        this.canvas.addEventListener("resize", this.onResize);
        // this.canvas.addEventListener("keydown", this.onKeyDown);
        
        this.container.appendChild(this.canvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.app.song.addEventListener("createInstrument", this.onResize);
        this.app.song.addEventListener("updateInstrument", this.onResize);
        this.app.song.addEventListener("deleteInstrument", this.onResize);
        this.app.song.addEventListener("createConnection", this.onResize);
        this.app.song.addEventListener("deleteConnection", this.onResize);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("createInstrument", this.onResize);
        this.app.song.removeEventListener("updateInstrument", this.onResize);
        this.app.song.removeEventListener("deleteInstrument", this.onResize);
        this.app.song.removeEventListener("createConnection", this.onResize);
        this.app.song.removeEventListener("deleteConnection", this.onResize);
    };

    onResize = () => {
        this.redrawCanvas();
    };

    onMouseDown = (e: PointerEvent) => {
        if (!this.dragTarget) {
            const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);
            if (!instrument) {

                const connection = this.connectionAtPoint(e.offsetX, e.offsetY);
                if (connection) {
                    this.selectedInstrument = null;
                    this.selectedConnection = connection;
                    this.redrawCanvas();
                }

                return;
            }

            this.selectedInstrument = instrument;
            this.selectedConnection = null;

            if (e.shiftKey) {
                this.dragTarget = new DragConnect(this, instrument, e);
            } else {
                this.dragTarget = new DragMove(this, instrument, e);
                console.log("CCK INSTRU", instrument)
            }

            this.redrawCanvas();
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
        return;
    };

    onContextMenu = (e: MouseEvent) => {
        console.log("onContextMenu")
        e.preventDefault();
    };

    onDblClick = (e: MouseEvent) => {
        const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);
        if (!instrument) {
            return;
        }

        // find pins view, bind to dblclicked instrument
        const tabIndex = this.app.sidebarTabs.tabs.tabs.findIndex(t => t.label === "Pins");
        if (tabIndex === -1) {
            return;
        }

        const panel = this.app.sidebarTabs.tabContent[tabIndex] as PinsPanel;
        panel.bindInstrument(instrument);
        this.app.sidebarTabs.setCurrentTab(tabIndex);

        e.preventDefault();
    };

    convertScreenToInstrument(pt: PointType) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        const ux = pt[0] / w;
        const uy = pt[1] / h;
        return [ ux * 2 - 1, uy * 2 - 1];
    }

    convertInstrumentToScreen(pt: PointType): PointType {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ux = pt[0] / 2 + 0.5;
        const uy = pt[1] / 2 + 0.5;

        return [ ux * w, uy * h ];
    }

    getInstrumentRect(instrument: InstrumentDocument): RectType {
        const c = this.convertInstrumentToScreen([instrument.x, instrument.y]);
        return [ c[0] - boxWidth / 2, c[1] - boxHeight / 2, c[0] + boxWidth / 2, c[1] + boxHeight / 2 ]
    }

    instrumentAtPoint(x: number, y: number) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (let instrument of this.app.song.instruments) {
            const rect = this.getInstrumentRect(instrument);
            if (ptInRect([x, y], rect)) {
                return instrument;
            }
        }
    }

    connectionAtPoint(x: number, y: number) {
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (let connection of this.app.song.connections) {
            const fromPt: PointType = this.convertInstrumentToScreen([connection.from.x, connection.from.y ]);
            const toPt: PointType = this.convertInstrumentToScreen([connection.to.x, connection.to.y ]);

            const c = rectCenter([...fromPt, ...toPt])
            const rect: RectType = [ c[0] - arrowSize, c[1] - arrowSize, c[0] + arrowSize, c[1] + arrowSize ];
            if (ptInRect([x, y], rect)) {
                return connection;
            }
        }
    }

    redrawCanvas() {
        const ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.font = "14px monospace";

        const em = ctx.measureText("M");
        const fontHeight = em.fontBoundingBoxAscent + em.fontBoundingBoxDescent;

        // autogenerate or movable boxors
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (let connection of this.app.song.connections) {
            const f = this.convertInstrumentToScreen([connection.from.x, connection.from.y]);
            const t = this.convertInstrumentToScreen([connection.to.x, connection.to.y]);

            ctx.strokeStyle = "#FFF";

            ctx.beginPath();
            ctx.moveTo(f[0], f[1]);
            ctx.lineTo(t[0], t[1]);
            ctx.stroke();

            // draw a triangle along the direction at center of connection c
            const c = rectCenter([f[0], f[1], t[0], t[1]]);

            // compute angle of line in unit vectors
            const d: PointType = [ t[0] - f[0], t[1] - f[1] ];
            const dl = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
            d[0] = d[0] / dl;
            d[1] = d[1] / dl;

            // "compute" the "normal" of the line - use to position the arrow butt
            const n = [ -d[1], d[0] ];

            ctx.beginPath();
            ctx.save();
            if (connection === this.selectedConnection) {
                // ctx.setLineDash([1, 1]);
                ctx.lineWidth = 3;
            }

            ctx.moveTo(c[0] + arrowSize * d[0], c[1] + arrowSize * d[1]);
            ctx.lineTo(c[0] - arrowSize * d[0] + n[0] * arrowSize, c[1] - arrowSize * d[1] + n[1] * arrowSize );
            ctx.lineTo(c[0] - arrowSize * d[0] - n[0] * arrowSize, c[1] - arrowSize * d[1] - n[1] * arrowSize );
            ctx.lineTo(c[0] + arrowSize * d[0], c[1] + arrowSize * d[1]);
            ctx.fillStyle = "#FFF";
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.stroke();
            ctx.restore();

            // if (connection === this.selectedConnection) {
            //     ctx.beginPath();
            //     ctx.save();
            //     ctx.setLineDash([2, 2]);
            //     ctx.lineWidth = 2;
            //     ctx.moveTo(c[0] - arrowSize - 5, c[1] - arrowSize - 5);
            //     ctx.lineTo(c[0] + arrowSize + 5, c[1] - arrowSize - 5);
            //     ctx.lineTo(c[0] + arrowSize + 5, c[1] + arrowSize + 5);
            //     ctx.lineTo(c[0] - arrowSize - 5, c[1] + arrowSize + 5);
            //     ctx.lineTo(c[0] - arrowSize - 5, c[1] - arrowSize - 5);
            //     ctx.stroke();
            //     ctx.restore();
            // }
        }

        if (this.connectFromInstrument) {
            const f = this.convertInstrumentToScreen([this.connectFromInstrument.x,this.connectFromInstrument.y])
            const t = this.connectToPt;
            ctx.strokeStyle = "#FFF";
            ctx.beginPath();
            ctx.moveTo(f[0], f[1]);
            ctx.lineTo(t[0], t[1]);
            ctx.stroke();
        }

        for (let instrument of this.app.song.instruments) {
            const c = this.convertInstrumentToScreen([instrument.x, instrument.y]);
            // const ux = instrument.x / 2 + 0.5;
            // const uy = instrument.y / 2 + 0.5;

            // only in = master = "#5C704C"
            // inout = fx = "#101010"
            // gen = "#2A614B"

            ctx.save();
            if (instrument === this.selectedInstrument) {
                // ctx.setLineDash([1, 1]);
                ctx.lineWidth = 3;
            }

            const hasIn = this.app.song.connections.find(c => c.to === instrument);
            const hasOut = this.app.song.connections.find(c => c.from === instrument);
            if (hasIn && !hasOut) {
                ctx.fillStyle = "#5C704C";
            } else if (hasIn && hasOut) {
                ctx.fillStyle = "#101010";
            } else {
                ctx.fillStyle = "#2A614B";
            }

            ctx.strokeStyle = "#000";

            ctx.fillRect(c[0] - boxWidth / 2, c[1] - boxHeight / 2, boxWidth, boxHeight);
            ctx.strokeRect(c[0] - boxWidth / 2, c[1] - boxHeight / 2, boxWidth, boxHeight);

            const mt = ctx.measureText(instrument.name);

            ctx.fillStyle = "#FFF";
            ctx.fillText(instrument.name, c[0] - mt.width / 2, c[1] + mt.fontBoundingBoxAscent - fontHeight / 2 );

            ctx.restore();

        }

    }

    getDomNode(): Node {
        return this.container;
    }
} 
