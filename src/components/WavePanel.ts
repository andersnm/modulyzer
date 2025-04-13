import { WaveEditorCanvas } from "./WaveEditorCanvas";
import { WaveScrollCanvas } from "./WaveScrollCanvas";
import { Appl } from "../App";
import { IComponent } from "../nutz";
import { WaveDocumentEx } from "../audio/SongDocument";
import { registerWaveEditorCommands } from "../commands/WaveEditor/Register";
import { ViewFrame } from "../nutz/ViewFrame";

export class WavePanel extends ViewFrame {
    app: Appl;
    view: HTMLDivElement;
    document: WaveDocumentEx;
    waveEditor: WaveEditorCanvas;
    waveScroll: WaveScrollCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerWaveEditorCommands(this);

        this.view = document.createElement("div");
        this.view.className = "flex flex-col flex-1";
        this.view.tabIndex = 0;

        this.waveEditor = new WaveEditorCanvas(this);
        this.waveScroll = new WaveScrollCanvas(this);

        this.setToolbar([
            {
                type: "button",
                label: "Cut",
                action: "cut",
            },
            {
                type: "button",
                label: "Copy",
                action: "copy",
            },
            {
                type: "button",
                label: "Paste",
                action: "paste",
            },
            {
                type: "button",
                label: "Crop",
                action: "crop",
            },
            {
                type: "button",
                label: "Zoom",
                action: "zoom",
            },
            {
                type: "button",
                label: "+",
                action: "zoom-in",
            },
            {
                type: "button",
                label: "-",
                action: "zoom-out",
            },
            {
                type: "button",
                label: "Play",
                action: "play-wave",
            },
            {
                type: "button",
                label: "Record",
                action: "record-wave",
            },
            {
                type: "button",
                label: "Save",
                action: "save-wave",
            },
            {
                type: "button",
                label: "Edit...",
                action: "edit-wave",
            },

        ]);

        this.view.appendChild(this.waveEditor.getDomNode());
        this.view.appendChild(this.waveScroll.getDomNode());

        this.setView(this.view);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.app.song.addEventListener("updateWave", this.onUpdate);
        this.app.song.addEventListener("deleteWave", this.onDeleteWave);
    };

    onUnmounted = () => {
        this.app.song.removeEventListener("updateWave", this.onUpdate);
        this.app.song.removeEventListener("deleteWave", this.onDeleteWave);
    };

    onUpdate = (ev: CustomEvent<WaveDocumentEx>) => {
        this.waveEditor.buffers = ev.detail.buffers;
        this.waveEditor.redrawCanvas();

        this.waveScroll.buffers = ev.detail.buffers;
        this.waveScroll.redrawCanvas();
    };

    onDeleteWave = (ev: CustomEvent<WaveDocumentEx>) => {
        if (ev.detail !== this.document) {
            return;
        }

        this.waveEditor.clear();
        this.waveScroll.clear();
        this.document = null;
    };

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source === this.waveEditor) {
            if (eventName === "selchange") {
                if (this.waveEditor.selection) {
                    const start = this.waveEditor.selection.start;
                    const end = this.waveEditor.selection.end;
                    this.waveScroll.setSelection(start, end);
                    this.document.selection = { ... this.waveEditor.selection };
                } else {
                    this.waveScroll.clearSelection();
                    this.document.selection = null;
                }
            } else if (eventName === "zoomchange") {
                if (this.waveEditor.zoom) {
                    const start = this.waveEditor.zoom.start;
                    const end = this.waveEditor.zoom.end;
                    this.waveScroll.setZoom(start, end);
                    this.document.zoom = { ... this.waveEditor.zoom };
                } else {
                    this.waveScroll.clearZoom();
                    this.document.zoom = null;
                }
            }
        } else if (source === this.waveScroll) {
            if (eventName === "selchange") {
                if (this.waveScroll.selection) {
                    const start = this.waveScroll.selection.start;
                    const end = this.waveScroll.selection.end;
                    this.waveEditor.setSelection(start, end);
                    this.document.selection = { ... this.waveScroll.selection };
                } else {
                    this.waveEditor.clearSelection();
                    this.document.selection = null;
                }
            } else if (eventName === "zoomchange") {
                if (this.waveScroll.zoom) {
                    const start = this.waveScroll.zoom.start;
                    const end = this.waveScroll.zoom.end;
                    this.waveEditor.setZoom(start, end);
                    this.document.zoom = { ... this.waveScroll.zoom };
                } else {
                    this.waveEditor.clearZoom();
                    this.document.zoom = null;
                }
            }
        }
    }

    getDomNode(): Node {
        return this.container;
    }

    setWave(wave: WaveDocumentEx) {
        this.document = wave;
        if (wave) {
            this.waveEditor.buffers = this.document.buffers;
            this.waveScroll.buffers = this.document.buffers;
        } else {
            this.waveEditor.buffers = this.waveScroll.buffers = [ new Float32Array(0) ] ;
        }

        if (wave?.zoom) {
            this.waveEditor.setZoom(wave.zoom.start, wave.zoom.end);
            this.waveScroll.setZoom(wave.zoom.start, wave.zoom.end);
        } else {
            this.waveEditor.clearZoom();
            this.waveScroll.clearZoom();
        }

        if (wave?.selection) {
            this.waveEditor.setSelection(wave.selection.start, wave.selection.end);
            this.waveScroll.setSelection(wave.selection.start, wave.selection.end);
        } else {
            this.waveEditor.clearSelection();
            this.waveScroll.clearSelection();
        }
    }

    zoomSelection() {
        if (!this.waveEditor.selection) {
            return;
        }

        const start = Math.min(this.waveEditor.selection.start, this.waveEditor.selection.end);
        const end = Math.max(this.waveEditor.selection.start, this.waveEditor.selection.end);

        this.waveEditor.setZoom(start, end);
        this.waveScroll.setZoom(start, end);
    }

    zoomRelative(ratio: number) {
        if (!this.waveEditor.zoom) {
            return;
        }

        const zoomLength = this.waveEditor.zoom.end - this.waveEditor.zoom.start;
        const center = this.waveEditor.zoom.start + zoomLength / 2;

        const documentLength = this.document.buffers[0].length;
        console.log("zoomeling ratio", ratio, this.waveEditor.zoom);

        const zoom = [
            Math.max(0, center - (zoomLength / 2 * ratio)),
            Math.min(documentLength - 1, center + (zoomLength / 2 * ratio)) 
        ];

        this.waveEditor.setZoom(zoom[0], zoom[1]);
        this.waveScroll.setZoom(zoom[0], zoom[1]);

        console.log("zoomeling after", ratio, this.waveEditor.zoom);
    }
}
