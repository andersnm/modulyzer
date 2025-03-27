import { WaveEditorCanvas } from "./WaveEditorCanvas";
import { WaveScrollCanvas } from "./WaveScrollCanvas";
import { Appl } from "../App";
import { ButtonToolbar, IComponent } from "../nutz";
import { WaveDocumentEx } from "../audio/SongDocument";

export class RecordingPanel implements IComponent {
    app: Appl;
    document: WaveDocumentEx;
    container: HTMLElement;
    toolbar: HTMLElement;
    waveEditor: WaveEditorCanvas;
    waveScroll: WaveScrollCanvas;

    constructor(app: Appl) {
        this.app = app;

        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        // flex div w/toolbar, wave, scroll stacked vertically
        this.waveEditor = new WaveEditorCanvas(this);
        this.waveScroll = new WaveScrollCanvas(this);

        this.toolbar = ButtonToolbar([
            {
                type: "button",
                label: "Crop",
                icon: "hgi-stroke hgi-crop",
                click: () => {},
            },
            {
                type: "button",
                label: "Zoom",
                icon: "hgi-stroke hgi-zoom-in-area",
                click: () => this.zoomSelection(),
            },
            {
                type: "button",
                label: "+",
                icon: "hgi-stroke hgi-zoom-in-area",
                click: () => this.zoomRelative(0.9),
            },
            {
                type: "button",
                label: "-",
                icon: "hgi-stroke hgi-zoom-in-area",
                click: () =>  this.zoomRelative(1.1),
            },
            {
                type: "button",
                label: "Play",
                icon: "hgi-stroke hgi-next",
                click: () => {},
            },
            {
                type: "button",
                label: "Record",
                icon: "hgi-stroke hgi-record",
                click: () => app.executeCommand("record-wave"),
            },
            {
                type: "button",
                icon: "hgi-stroke hgi-folder",
                label: "Save",
                click: () => app.downloadWave(this.document),
            },

        ]);

        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.waveEditor.getDomNode());
        this.container.appendChild(this.waveScroll.getDomNode());

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.app.song.addEventListener("updateWave", this.onUpdate);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("updateWave", this.onUpdate);
    };

    onUpdate = () => {
        this.waveEditor.redrawCanvas();
        this.waveScroll.redrawCanvas();
    };


    zoomRelative(ratio: number) {
        if (!this.waveEditor.zoom) {
            return;
        }

        const zoomLength = this.waveEditor.zoom.end - this.waveEditor.zoom.start;
        const center = this.waveEditor.zoom.start + zoomLength / 2;

        const documentLength = this.document.buffers[0].length;
        console.log("zoomeling ratio", ratio, this.waveEditor.zoom);

        this.waveEditor.setZoom(
            Math.max(0, center - (zoomLength / 2 * ratio)),
            Math.min(documentLength - 1, center + (zoomLength / 2 * ratio))
        );

        console.log("zoomeling after", ratio, this.waveEditor.zoom);

    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source === this.waveEditor) {
            if (eventName === "selchange") {
                if (this.waveEditor.selection) {
                    const start = this.waveEditor.selection.start;
                    const end = this.waveEditor.selection.end;
                    this.waveScroll.setSelection(start, end);
                } else {
                    this.waveScroll.clearSelection();
                }
            } else if (eventName === "zoomchange") {
                if (this.waveEditor.zoom) {
                    const start = this.waveEditor.zoom.start;
                    const end = this.waveEditor.zoom.end;
                    this.waveScroll.setZoom(start, end);
                }
            }
        } else if (source === this.waveScroll) {
            if (eventName === "selchange") {
                if (this.waveScroll.selection) {
                    const start = this.waveScroll.selection.start;
                    const end = this.waveScroll.selection.end;
                    this.waveEditor.setSelection(start, end);
                } else {
                    this.waveEditor.clearSelection();
                }
            } else if (eventName === "zoomchange") {
                if (this.waveScroll.zoom) {
                    const start = this.waveScroll.zoom.start;
                    const end = this.waveScroll.zoom.end;
                    this.waveEditor.setZoom(start, end);
                }
            }
        }
    }

    setWave(wave: WaveDocumentEx) {
        this.document = wave;
        this.waveEditor.buffers = this.document.buffers;
        this.waveEditor.zoom = undefined;
        this.waveEditor.selection = undefined;

        this.waveEditor.redrawCanvas();

        this.waveScroll.buffers = this.document.buffers;
        this.waveScroll.redrawCanvas();
    }

    getDomNode(): Node {
        return this.container;
    }

    zoomSelection() {
        if (!this.waveEditor.selection) {
            return;
        }

        const start = Math.min(this.waveEditor.selection.start, this.waveEditor.selection.end);
        const end = Math.max(this.waveEditor.selection.start, this.waveEditor.selection.end);

        this.waveEditor.setZoom(start, end);
        this.waveEditor.redrawCanvas();
    }
}