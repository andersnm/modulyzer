import { WaveEditorCanvas } from "./WaveEditorCanvas";
import { WaveScrollCanvas } from "./WaveScrollCanvas";
import { Appl } from "../App";
import { CommandButtonBar, CommandHost, StatusBar } from "../nutz";
import { InstrumentDocument, WaveDocument } from "../audio/SongDocument";
import { ViewFrame } from "../nutz/ViewFrame";
import { formatNote } from "./PatternEditorHelper";
import { MenuItem } from "../nutz";
import { showCreateNewWaveDialog } from "../dialogs/CreateNewWaveDialog";

export class WavePanel extends ViewFrame {
    app: Appl;
    actionButtons: CommandButtonBar;
    view: HTMLDivElement;
    document: WaveDocument;
    waveEditor: WaveEditorCanvas;
    waveScroll: WaveScrollCanvas;
    statusBar: StatusBar;
    redrawTimer: number | null = null;

    constructor(app: Appl, parent: CommandHost) {
        super(parent);
        this.app = app;

        this.view = document.createElement("div");
        this.view.className = "flex flex-col flex-1";
        this.view.tabIndex = 0;

        this.waveEditor = new WaveEditorCanvas();
        this.waveEditor.addEventListener("selchange", this.onWaveEditorSelChange);
        // this.waveEditor.addEventListener("zoomchange", this.onWaveEditorZoomChange);

        this.waveScroll = new WaveScrollCanvas();
        this.waveScroll.addEventListener("selchange", this.onWaveScrollSelChange);
        this.waveScroll.addEventListener("zoomchange", this.onWaveScrollZoomChange);

        this.actionButtons = new CommandButtonBar(this, [
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
                type: "separator",
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
                label: "Properties...",
                action: "edit-wave",
            },
        ]);

        this.addToolbar(this.actionButtons.getDomNode() as HTMLElement);

        this.view.appendChild(this.waveEditor.getDomNode());
        this.view.appendChild(this.waveScroll.getDomNode());

        this.setView(this.view);

        this.statusBar = new StatusBar();
        this.statusBar.addPart(["w-48"], "Offset: 0")
        this.statusBar.addPart(["w-24"], "---")
        this.statusBar.addPart(["flex-1", "cursor-pointer"], "No instrument selected")
        this.statusBar.addPart(["flex-1"], "No wave selected")

        this.statusBar.parts[1].title = "MIDI Note";
        this.statusBar.parts[2].title = "Instrument";
        this.statusBar.parts[2].addEventListener("click", this.onStatusBarInstrumentContextMenu);
        this.statusBar.parts[3].title = "Wave";

        // NOTE: Adding statusbar in ViewFrame's container
        this.container.appendChild(this.statusBar.getDomNode());

        this.updateToolbarButtons();

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        let playPosition = -1;
        this.redrawTimer = setInterval(() => {
            if (this.document) {
                const playerWave = this.app.playerSongAdapter.waveMap.get(this.document);
                const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(this.document.instrument);
                const wavePlayPosition = playerInstrument?.instrument.getWavePlayPosition(playerWave) ?? 0;
                if (wavePlayPosition !== playPosition) {
                    playPosition = wavePlayPosition;
                    // const waveDurationSec = this.document.sampleCount / this.document.sampleRate;
                    this.waveEditor.playPosition = playPosition * this.document.sampleRate;
                    this.waveEditor.redrawOverlayCanvas();
                    this.waveScroll.playPosition = playPosition * this.document.sampleRate;
                    this.waveScroll.redrawOverlayCanvas();
                }
            }
        }, 100);
    };

    onUnmounted = () => {
        clearInterval(this.redrawTimer);
        this.redrawTimer = null;
    };

    updateToolbarButtons() {
        this.setCommandState("copy", { enabled: !!this.document && !!this.document.selection });
        this.setCommandState("cut", { enabled: !!this.document && !!this.document.selection });
        this.setCommandState("paste", { enabled: !!this.document && !!this.document.selection });
        this.setCommandState("crop", { enabled: !!this.document && !!this.document.selection });
        this.setCommandState("zoom", { enabled: !!this.document && !!this.document.selection });
        this.setCommandState("zoom-in", { enabled: !!this.document && !!this.document });
        this.setCommandState("zoom-out", { enabled: !!this.document });
        this.setCommandState("play-wave", { enabled: !!this.document });
        this.setCommandState("record-wave", { enabled: !!this.document });
        this.setCommandState("save-wave", { enabled: !!this.document });
        this.setCommandState("edit-wave", { enabled: !!this.document });
    }

    onStatusBarInstrumentContextMenu = async (ev: MouseEvent) => {
        const instruments = this.getWaveTableInstruments();
        const menuItems: MenuItem[] = [];
        for (let instrument of instruments) {

            const waveItems: MenuItem[] = [
                {
                    label: "Create new...",
                    action: () => this.statusCreateNewAndGotoWave(instrument),
                }
            ];

            for (let wave of instrument.waves) {
                waveItems.push({
                    label: wave.name,
                    action: () => this.setWave(wave),
                    checked: wave === this.document,
                });
            }

            menuItems.push({
                label: instrument.name,
                checked: instrument === this.document?.instrument,
                items: waveItems,
            });
        }

        const rc = (ev.target as HTMLElement).getBoundingClientRect();
        const action = await this.app.contextMenuContainer.showPopup(rc.left + ev.offsetX, rc.top + ev.offsetY, menuItems);
        if (!action || typeof action !== "function") {
            return false;
        }

        action();

        return true;
    };

    onWaveEditorSelChange = () => {
        if (!this.document) {
            return;
        }

        if (this.waveEditor.selection) {
            const start = this.waveEditor.selection.start;
            const end = this.waveEditor.selection.end;
            this.waveScroll.setSelection(start, end);
            this.document.selection = { ... this.waveEditor.selection };
        } else {
            this.waveScroll.clearSelection();
            this.document.selection = null;
        }

        this.updateToolbarButtons();
    }

    // onWaveEditorZoomChange = () => {
    //     if (!this.document) {
    //         return;
    //     }

    //     if (this.waveEditor.zoom) {
    //         const start = this.waveEditor.zoom.start;
    //         const end = this.waveEditor.zoom.end;
    //         this.waveScroll.setZoom(start, end);
    //         this.document.zoom = { ... this.waveEditor.zoom };
    //     } else {
    //         this.waveScroll.clearZoom();
    //         this.document.zoom = null;
    //     }
    // };

    onWaveScrollSelChange = () => {
        if (this.waveScroll.selection) {
            const start = this.waveScroll.selection.start;
            const end = this.waveScroll.selection.end;
            this.waveEditor.setSelection(start, end);
            this.document.selection = { ... this.waveScroll.selection };
        } else {
            this.waveEditor.clearSelection();
            this.document.selection = null;
        }

        this.updateToolbarButtons();
    };

    onWaveScrollZoomChange = () => {
        if (this.waveScroll.zoom) {
            const start = this.waveScroll.zoom.start;
            const end = this.waveScroll.zoom.end;
            this.waveEditor.setZoom(start, end);
            this.document.zoom = { ... this.waveScroll.zoom };
        } else {
            this.waveEditor.clearZoom();
            this.document.zoom = null;
        }
    };

    async statusCreateNewAndGotoWave(instrument: InstrumentDocument) {
        const wave = await showCreateNewWaveDialog(this.app, instrument);
        if (wave) {
            this.setWave(wave);
        }
    }

    getWaveTableInstruments() {
        const result: InstrumentDocument[] = [];
        for (let instrument of this.app.song.instruments) {
            const factory = this.app.player.getInstrumentFactoryById(instrument.instrumentId);
            if (!factory.useWaveTable) {
                continue;
            }

            result.push(instrument);
        }

        return result;
    }

    setWave(wave: WaveDocument) {
        this.waveEditor.clearZoom();
        this.waveScroll.clearZoom();
        this.waveEditor.clearSelection();
        this.waveScroll.clearSelection();

        this.document = wave;
        if (wave) {
            this.waveEditor.buffers = this.document.buffers;
            this.waveScroll.buffers = this.document.buffers;
        } else {
            this.waveEditor.buffers = this.waveScroll.buffers = [ new Float32Array(0) ] ;
        }

        // TODO: invalidate when assigning buffers
        this.waveEditor.redrawCanvas();
        this.waveScroll.redrawCanvas();

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

        if (wave) {
            this.statusBar.setText(1, formatNote(wave.note));
            this.statusBar.setText(2, wave.instrument.name + "▾");
            this.statusBar.setText(3, wave.name);
        } else {
            this.statusBar.setText(1, "---");
            this.statusBar.setText(2, "No instrument selected");
            this.statusBar.setText(3, "No wave selected");
        }

        this.updateToolbarButtons();
    }

    zoomSelection() {
        if (!this.waveEditor.selection) {
            return;
        }

        const start = Math.min(this.waveEditor.selection.start, this.waveEditor.selection.end);
        const end = Math.max(this.waveEditor.selection.start, this.waveEditor.selection.end);

        this.waveEditor.setZoom(start, end);
        this.waveScroll.setZoom(start, end);

        this.document.zoom = { start, end };
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

        this.document.zoom = { start: zoom[0], end: zoom[1] };
    }

    clearZoom() {
        this.waveEditor.clearZoom();
        this.waveScroll.clearZoom();
        this.document.zoom = null; // TODO: not great
    }

    setSelection(start: number, end: number) {
        this.waveEditor.setSelection(start, end);
        this.waveScroll.setSelection(start, end);
    }

    clearSelection() {
        this.waveEditor.clearSelection();
        this.waveScroll.clearSelection();
    }

    getSelection() {
        if (!this.waveEditor.selection) {
            return null;
        }

        const start = Math.min(this.waveEditor.selection.start, this.waveEditor.selection.end);
        const end = Math.max(this.waveEditor.selection.start, this.waveEditor.selection.end);

        return { start, end };
    }
}
