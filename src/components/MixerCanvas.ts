import { DragTarget, ICommandHost, IComponent, PointType, ptInRect, rectCenter, RectType } from "../nutz";
import { FlexCanvas } from "./FlexCanvas";
import { Appl } from "../App";
import { ConnectionDocument, InstrumentDocument } from "../audio/SongDocument";
import { PinsPanel } from "./PinsPanel";
import { MenuItem } from "../menu/menu";
import { getNoteForKey } from "./PatternEditorHelper";

const boxWidth = 100;
const boxHeight = 61; // 1.618
const arrowSize = 10;
const connectionGainHeight = 150;
const connectionGainWidth = 32;
const connectionGainHandleHeight = 24;

const instrumentMenu: MenuItem[] = [
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
    {
        label: "Send Sysex...",
        action: "send-sysex",
        // enabled: factory.useSysex,
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

        const connectFromInstrument = this.component.connectFromInstrument;
        this.component.connectFromInstrument = null;
        this.component.connectToPt = null;

        if (connectToInstrument) {
            this.component.app.song.createConnection(connectFromInstrument, connectToInstrument);
        }
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
    }

    move(e: PointerEvent) {
        const deltaGain = (this.startY - e.offsetY) / (connectionGainHeight - connectionGainHandleHeight) * 2;
        const gain = Math.max(0, Math.min(2, this.startGain + deltaGain));
        this.component.app.song.updateConnection(this.connection, gain);
        this.component.redrawCanvas(); // TODO: on update event
    }

    up(e: PointerEvent) {
        this.component.drawConnectionPosition = null;
        this.component.redrawCanvas();
    }
}

export class MixerCanvas implements IComponent {
    app: Appl;
    commandHost: ICommandHost
    container: HTMLElement;
    canvas: HTMLCanvasElement;

    dragTarget: DragTarget | null = null;

    connectFromInstrument: InstrumentDocument;
    connectToPt: PointType;

    selectedInstrument: InstrumentDocument;
    selectedConnection: ConnectionDocument;

    drawConnectionPosition: PointType | null = null;

    constructor(app: Appl, commandHost: ICommandHost) {
        this.app = app;
        this.commandHost = commandHost;
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

        this.container.appendChild(this.canvas);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
        this.container.addEventListener("keydown", this.onKeyDown);
        this.container.addEventListener("keyup", this.onKeyUp);
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

    onKeyDown = (e: KeyboardEvent) => {
        if (this.editNoteKeyDown(e)) {
            return;
        }
    };

    onKeyUp = (e: KeyboardEvent) => {
        if (this.editNoteKeyUp(e)) {
            return;
        }
    };

    private editNoteKeyDown(ev: KeyboardEvent) {

        if (ev.repeat) {
            return false;
        }

        const note = getNoteForKey(ev.code, 4);
        console.log("key down note " + note)
        if (note !== -1) {
            // Send midi to instrumnt
            // TODO: stuck notes if canvas loses focus before key up
            const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(this.selectedInstrument);
            playerInstrument.sendMidi(this.app.device.context.currentTime, 0x90, note, 127);
            return true;
        }

        return false;
    }

    editNoteKeyUp(ev: KeyboardEvent) {
        const note = getNoteForKey(ev.code, 4);
        console.log("key up note " + note)
        if (note !== -1) {
            const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(this.selectedInstrument);
            playerInstrument.sendMidi(0, 0x90, note, 0);
            return true;
        }

        return false;
    }

    onMouseDown = (e: PointerEvent) => {
        if (!this.dragTarget) {
            const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);
            if (!instrument) {

                const connection = this.connectionAtPoint(e.offsetX, e.offsetY);
                if (connection) {
                    this.selectedInstrument = null;
                    this.selectedConnection = connection;
                    this.dragTarget = new DragConnectionGain(this, connection, e);
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

        const p = [ e.offsetX, e.offsetY ];
        const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);

        const rc = this.canvas.getBoundingClientRect();

        if (!instrument) {

            // click mixer bg -> create insturment
            // create menu with instrument factory parameter
            const mixerMenu: MenuItem[] = [ {
                label: "Create Instrument...",
                action: "add-instrument"
            }];

            this.app.contextMenuContainer.show(this.commandHost, rc.left + e.offsetX, rc.top + e.offsetY, mixerMenu);
            e.preventDefault();

            return;
        }

        this.app.contextMenuContainer.show(this.commandHost, rc.left + e.offsetX, rc.top + e.offsetY, instrumentMenu);
        e.preventDefault();
    };

    onDblClick = (e: MouseEvent) => {
        const instrument = this.instrumentAtPoint(e.offsetX, e.offsetY);
        if (!instrument) {
            return;
        }

        this.commandHost.executeCommand("goto-pins");
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
