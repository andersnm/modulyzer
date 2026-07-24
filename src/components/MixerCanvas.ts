import { CommandHost, DragTarget, IComponent, PointType, ptInRect, rectCenter, RectType } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { Appl } from "../App";
import { ConnectionDocument, InstrumentDocument } from "../audio/SongDocument";
import { CommandMenuItem } from "../menu/menu";
import { noteKeyDown, noteKeyStopAll, noteKeyUp } from "../KeyboardNoteHelper";

function colorWithBrightness(r: number, g: number, b: number, brightness: number) {
    const red = Math.max(0, Math.min(255, Math.round(r * brightness)));
    const green = Math.max(0, Math.min(255, Math.round(g * brightness)));
    const blue = Math.max(0, Math.min(255, Math.round(b * brightness)));
    return "rgb(" + red + ", " + green + ", " + blue + ")";
}

const boxWidth = 100;
const boxHeight = 61; // 1.618
const arrowSize = 10;
const connectionGainHeight = 150;
const connectionGainWidth = 32;
const connectionGainHandleHeight = 24;

const instrumentMenu: CommandMenuItem[] = [
    {
        label: "Toggle Mute",
        action: "mute",
    },
    {
        label: "Pins",
        action: "goto-pins",
    },
    {
        label: "Wavetable",
        action: "goto-wavetable",
    },
    {
        label: "Delete",
        action: "delete-selection",
    },
];

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
        // TODO: drag shadow box on overlay
        this.component.redrawOverlayCanvas();
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
        this.component.redrawOverlayCanvas();
    }

    up(e: PointerEvent) {
        // actually commit to document, we just changed the value directly in the document (without notifying anybody)
        const connectToInstrument = this.component.instrumentAtPoint(e.offsetX, e.offsetY);

        const connectFromInstrument = this.component.connectFromInstrument;
        this.component.connectFromInstrument = null;
        this.component.connectToPt = null;
        this.component.redrawOverlayCanvas();

        if (!connectToInstrument) {
            return;
        }

        if (connectToInstrument === connectFromInstrument) {
            return;
        }

        this.component.app.song.createConnection(connectFromInstrument, connectToInstrument);
    }
}

class DragConnectionGain extends DragTarget {
    component: MixerCanvas;
    startY: number;
    startGain: number;
    connection: ConnectionDocument;

    constructor(component: MixerCanvas, connection: ConnectionDocument, e: PointerEvent) {
        super();

        this.component = component;
        this.connection = connection;
        this.startY = e.offsetY;
        this.startGain = connection.gain;

        const handlePosition = (1 - (connection.gain / 2)) * (connectionGainHeight - connectionGainHandleHeight);

        this.component.drawConnectionPosition = [ e.offsetX - (connectionGainWidth / 2), e.offsetY - handlePosition - (connectionGainHandleHeight / 2) ];
        this.component.redrawOverlayCanvas();
    }

    move(e: PointerEvent) {
        const deltaGain = (this.startY - e.offsetY) / (connectionGainHeight - connectionGainHandleHeight) * 2;
        const gain = Math.max(0, Math.min(2, this.startGain + deltaGain));
        this.component.app.song.updateConnection(this.connection, gain);
        this.component.redrawOverlayCanvas(); // TODO: on update event
    }

    up(e: PointerEvent) {
        this.component.drawConnectionPosition = null;
        this.component.redrawOverlayCanvas();
    }
}

export class MixerCanvas implements IComponent {
    app: Appl;
    commandHost: CommandHost;
    container: HTMLElement;
    canvas: HTMLCanvasElement;
    overlayCanvas: HTMLCanvasElement;

    dragTarget: DragTarget | null = null;

    connectFromInstrument: InstrumentDocument;
    connectToPt: PointType;

    selectedInstrument: InstrumentDocument;
    selectedConnection: ConnectionDocument;

    drawConnectionPosition: PointType | null = null;
    clickPt: PointType = [ 0, 0 ];

    constructor(app: Appl, commandHost: CommandHost) {
        this.app = app;
        this.commandHost = commandHost;
        this.container = document.createElement("div");
        this.container.classList.add("flex-1", "w-full", "pb-1", "relative");
        this.container.tabIndex = 0;
        
        this.canvas = FlexCanvas();
        this.canvas.classList.add("rounded-lg", "touch-none", "absolute", "w-full", "h-full"); // touch-none class fixes pointermove

        this.container.addEventListener("pointerdown", this.onMouseDown);
        this.container.addEventListener("pointerup", this.onMouseUp);
        this.container.addEventListener("pointermove", this.onMouseMove);
        this.container.addEventListener("contextmenu", this.onContextMenu);
        this.container.addEventListener("dblclick", this.onDblClick);
        this.canvas.addEventListener("resize", this.onResize);

        this.overlayCanvas = FlexCanvas();
        this.overlayCanvas.classList.add("rounded-lg", "touch-none", "absolute", "w-full", "h-full");
        // this.overlayCanvas.style.mixBlendMode = "difference"; NOT USING MIXING HERE

        this.overlayCanvas.addEventListener("resize", this.onResizeOverlay);

        this.container.appendChild(this.canvas);
        this.container.appendChild(this.overlayCanvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
        this.container.addEventListener("keydown", this.onKeyDown);
        this.container.addEventListener("keyup", this.onKeyUp);
        this.container.addEventListener("focusout", this.onFocusOut);
    }

    monitorInterval: number | null = null;

    onMounted = () => {
        this.monitorInterval = setInterval(() => {
            this.redrawOverlayCanvas();
        }, 100);

        this.app.song.addEventListener("createInstrument", this.onUpdate);
        this.app.song.addEventListener("updateInstrument", this.onUpdate);
        this.app.song.addEventListener("deleteInstrument", this.onUpdate);
        this.app.song.addEventListener("setInstrumentMuted", this.onResize);
        this.app.song.addEventListener("createConnection", this.onResize);
        this.app.song.addEventListener("deleteConnection", this.onResize);
    };

    onUnmounted = () => {
        if (this.monitorInterval !== null) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }

        this.app.song.removeEventListener("createInstrument", this.onUpdate);
        this.app.song.removeEventListener("updateInstrument", this.onUpdate);
        this.app.song.removeEventListener("deleteInstrument", this.onUpdate);
        this.app.song.removeEventListener("setInstrumentMuted", this.onResize);
        this.app.song.removeEventListener("createConnection", this.onResize);
        this.app.song.removeEventListener("deleteConnection", this.onResize);
    };

    onResize = () => {
        this.redrawCanvas();
    };

    onResizeOverlay = () => {
        this.redrawOverlayCanvas();
    };

    onUpdate = () => {
        this.redrawCanvas();
        this.redrawOverlayCanvas();
    };

    onKeyDown = (e: KeyboardEvent) => {
        if (noteKeyDown(this.app, this.selectedInstrument, e)) {
            return;
        }
    };

    onKeyUp = (e: KeyboardEvent) => {
        if (noteKeyUp(this.app, this.selectedInstrument,e)) {
            return;
        }
    };

    onFocusOut = (e: FocusEvent) => {
        const nextFocused = e.relatedTarget as HTMLElement;
        if (!nextFocused || !this.container.contains(nextFocused)) {
            noteKeyStopAll(this.app);
        }
    };

    onMouseDown = (e: PointerEvent) => {
        if (!this.dragTarget) {
            const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);
            if (!instrument) {

                const connection = this.connectionAtPoint(e.offsetX, e.offsetY);
                if (connection) {
                    this.selectedInstrument = null;
                    this.selectedConnection = connection;
                    this.container.dispatchEvent(new CustomEvent("selchange"))
                    this.dragTarget = new DragConnectionGain(this, connection, e);
                    this.canvas.setPointerCapture(e.pointerId);

                    this.redrawCanvas();
                } else {
                    const p: PointType = [ e.offsetX, e.offsetY ];
                    this.clickPt = this.convertScreenToInstrument(p);

                    this.selectedInstrument = null;
                    this.selectedConnection = null;
                    this.container.dispatchEvent(new CustomEvent("selchange"))
                    this.redrawCanvas();
                }

                return;
            }

            this.selectedInstrument = instrument;
            this.selectedConnection = null;
            this.container.dispatchEvent(new CustomEvent("selchange"))

            if (e.shiftKey) {
                this.dragTarget = new DragConnect(this, instrument, e);
            } else {
                this.dragTarget = new DragMove(this, instrument, e);
                console.log("CCK INSTRU", instrument)
            }

            this.canvas.setPointerCapture(e.pointerId);

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

    onContextMenu = async (e: MouseEvent) => {
        console.log("onContextMenu")

        const p: PointType = [ e.offsetX, e.offsetY ];
        this.clickPt = this.convertScreenToInstrument(p);
        
        const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);

        const rc = this.canvas.getBoundingClientRect();

        if (!instrument) {

            // click mixer bg -> create insturment
            // create menu with instrument factory parameter
            const mixerMenu: CommandMenuItem[] = [ {
                label: "Create Instrument...",
                items: []
            },
            {
                label: "Create Effect...",
                items: []
            }];

            for (let factory of this.app.instrumentFactories) {
                const index = factory.maxPolyphony > 0 ? 0 : 1;
                mixerMenu[index].items.push({
                    label: factory.identifier,
                    action: factory.identifier,
                });
            }

            mixerMenu[0].items.sort((a, b) => a.label.localeCompare(b.label));
            mixerMenu[1].items.sort((a, b) => a.label.localeCompare(b.label));

            e.preventDefault();

            const action = await this.app.contextMenuContainer.showPopup(rc.left + e.offsetX, rc.top + e.offsetY, mixerMenu);
            if (!action || typeof action === "function") {
                return;
            }

            await this.app.createInstrument(action, this.clickPt[0], this.clickPt[1]);
            return;
        }

        e.preventDefault();
        await this.app.contextMenuContainer.show(this.commandHost, rc.left + e.offsetX, rc.top + e.offsetY, instrumentMenu);
    };

    onDblClick = (e: MouseEvent) => {
        const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);
        if (!instrument) {
            return;
        }

        this.commandHost.executeCommand("goto-pins");
        e.preventDefault();
    };

    convertScreenToInstrument(pt: PointType): PointType {
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
        console.log("mixer redraw")
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

            const instrumenteer = this.app.playerSongAdapter.instrumentMap.get(instrument);
            const hasIn = !!instrumenteer.instrument.inputNode;
            const hasOut = !!instrumenteer.instrument.outputNode;
            const brightness = instrument.muted ? 0.6 : 1.0;
            if (hasIn && !hasOut) {
                ctx.fillStyle = colorWithBrightness(92, 112, 76, brightness);
            } else if (hasIn && hasOut) {
                ctx.fillStyle = colorWithBrightness(68, 68, 68, brightness);
            } else {
                ctx.fillStyle = colorWithBrightness(42, 97, 75, brightness);
            }

            ctx.strokeStyle = "#000";

            ctx.fillRect(c[0] - boxWidth / 2, c[1] - boxHeight / 2, boxWidth, boxHeight);
            ctx.strokeRect(c[0] - boxWidth / 2, c[1] - boxHeight / 2, boxWidth, boxHeight);

            const name = instrument.muted ? "(" + instrument.name + ")" : instrument.name;
            const mt = ctx.measureText(name);

            ctx.fillStyle = "#FFF";
            ctx.fillText(name, c[0] - mt.width / 2, c[1] + mt.fontBoundingBoxAscent - fontHeight / 2 );

            ctx.restore();

        }
    }

    redrawOverlayCanvas() {
        // console.log("mixer overlay redraw")
        const ctx = this.overlayCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        // TODO: draw selected connection border

        // draw connection wire while dragging (TODO: clip instruments?)
        if (this.connectFromInstrument) {
            const f = this.convertInstrumentToScreen([this.connectFromInstrument.x,this.connectFromInstrument.y])
            const t = this.connectToPt;
            ctx.strokeStyle = "#FFF";
            ctx.beginPath();
            ctx.moveTo(f[0], f[1]);
            ctx.lineTo(t[0], t[1]);
            ctx.stroke();
        }

        // draw instrument activity

        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;

        ctx.fillStyle = "#f00";
        for (let instrument of this.app.song.instruments) {
            const c = this.convertInstrumentToScreen([instrument.x, instrument.y]);
            const instrumenteer = this.app.playerSongAdapter.instrumentMap.get(instrument);

            if (!instrumenteer || !instrumenteer.activity) {
                continue;
            }

            const boxLeft = c[0] - boxWidth / 2;
            const boxTop = c[1] - boxHeight / 2;
            ctx.fillRect(boxLeft + 5, boxTop + 5, 8, 8);
            ctx.strokeRect(boxLeft + 5, boxTop + 5, 8, 8);
        }

        // draw instrument inactivity
        ctx.fillStyle = "#000";
        for (let instrument of this.app.song.instruments) {
            const c = this.convertInstrumentToScreen([instrument.x, instrument.y]);
            const instrumenteer = this.app.playerSongAdapter.instrumentMap.get(instrument);

            if (instrumenteer && instrumenteer.activity) {
                continue;
            }

            const boxLeft = c[0] - boxWidth / 2;
            const boxTop = c[1] - boxHeight / 2;
            ctx.fillRect(boxLeft + 5, boxTop + 5, 8, 8);
            ctx.strokeRect(boxLeft + 5, boxTop + 5, 8, 8);
        }

        // TODO: draw selected instrument border
        // TODO: draw dragging instrument shadow

        // draw connection gain slider widget
        if (this.drawConnectionPosition) {
            // Fill outside rectangle
            ctx.fillStyle = "#FFF";
            ctx.fillRect(this.drawConnectionPosition[0], this.drawConnectionPosition[1], connectionGainWidth, connectionGainHeight);

            // Draw outside rectangle border
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.strokeRect(this.drawConnectionPosition[0], this.drawConnectionPosition[1], connectionGainWidth, connectionGainHeight);

            // Draw handle 0..2
            const handlePosition = (1 - (this.selectedConnection.gain / 2)) * (connectionGainHeight - connectionGainHandleHeight);
            ctx.strokeRect(this.drawConnectionPosition[0], this.drawConnectionPosition[1] + handlePosition, connectionGainWidth, connectionGainHandleHeight);
        }
    }

    getDomNode(): Node {
        return this.container;
    }
} 
