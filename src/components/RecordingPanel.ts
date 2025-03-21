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
        this.waveScroll = new WaveScrollCanvas();

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
                click: () => {},
            },
            {
                type: "button",
                label: "+",
                icon: "hgi-stroke hgi-zoom-in-area",
                click: () => {},
            },
            {
                type: "button",
                label: "-",
                icon: "hgi-stroke hgi-zoom-in-area",
                click: () => {},
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

    // onPlay = () => {
    //     // can we document.play()?
    //     this.dispatch(this.props, "play", this)
    // }

    // onRecord = () => {
    //     // is it enought to document.record()? dont allow edit while recording, commit to history when done
    //     this.dispatch(this.props, "record", this)
    // }

    // onCrop = () => {
    //     console.log("CROP USING, ", this.props.selection)
    //     this.document.crop(this.props.selection.start, this.props.selection.end);
    //     // TODO; commit here?? all edits must commit
    // };

    // onCopy = async () => {
    //     // this.props.document.copy(this.props.selection.start, this.props.selection.end);
    //     const rangeRecording = await this.document.createRecordingFromRange(this.props.selection.start, this.props.selection.end);
    //     await writeClipboardRecording(rangeRecording);
    // };

    // onCut = async () => {
    //     // this.props.document.copy(this.props.selection.start, this.props.selection.end);
    //     const rangeRecording = await this.document.deleteRange(this.props.selection.start, this.props.selection.end);
    //     this.document.commit("Cut")

    //     await writeClipboardRecording(rangeRecording);
    // };

    // onPaste = async () => {
    //     const clipboardRecording = await readClipboardRecording();
    //     if (!clipboardRecording) {
    //         return ;
    //     }

    //     console.log("CLIP HAS", clipboardRecording)
    //     const recording = await this.document.storage.createRecording(clipboardRecording.sampleRate, clipboardRecording.buffers);
    //     await this.document.replaceRange(this.props.selection.start, recording);
    //     await this.document.commit("Paste");
    // };

    // onUndo = () => {
    //     this.document.undo();
    // };

    // onRedo = () => {
    //     this.document.redo();
    // };

    // onZoom = () => {
    //     // should zoom, playposition be in document?
    //     this.document.setZoom(this.props.selection);
    // };

    // onZoomIn = () => {
    //     this.zoomRelative(0.9);
    // };

    // onZoomOut = () => {
    //     // TODO; ratio av hele dokumentet? eller linear expand/compct zoom by units? eller ratio av current zoom?
    //     this.zoomRelative(1.1)
    // };

    // zoomRelative(ratio) {
    //     if (!this.document.zoom) {
    //         return;
    //     }

    //     const zoomLength = this.document.zoom.end - this.document.zoom.start;
    //     const center = this.document.zoom.start + zoomLength / 2;

    //     const documentLength = this.document.recording.buffers[0].length;
    //     console.log("zoomeling ratio", ratio, this.document.zoom);

    //     // this.document.zoom
    //     this.document.setZoom({
    //         start: Math.max(0, center - (zoomLength / 2 * ratio)),
    //         end: Math.min(documentLength - 1, center + (zoomLength / 2 * ratio))
    //         // start: center - (zoomLength / 2 * ratio),
    //         // end: center + (zoomLength / 2 * ratio)
    //     });

    //     console.log("zoomeling after", ratio, this.document.zoom);

    // }

    // onUpdateFromDocument = () => {
    //     if (!this.props) {
    //         console.log("Document changed but recordingpanel isnt rendered")
    //         return;
    //     }
    //     console.log("Document changed", this.document)
    //     // this.props.canUndo;
    //     this.props.historyPosition = this.document.document.historyPosition;
    //     this.props.playPosition = this.document.playPosition;
    //     this.props.selection = this.document.selection ? {...this.document.selection } : null; // temp - something changed elsewhere needing this
    //     this.props.zoom = this.document.zoom ? {...this.document.zoom } : null; // temp - something changed elsewhere needing this
    //     this.props.recordingName = this.document.document.name;
    //     this.props.buffers = this.document.recording.buffers;
    // };

    // onShowExport = () => {
    //     this.props.showExportDialog = true;
    // };

    // onExport = () => {
    //     // this.props.showExportDialog = true;
    //     const blob = this.document.exportWav(this.document.recording)
    //     var a = window.document.createElement("a");
    //     window.document.body.appendChild(a);
    //     a.style.display = "none";

    //     // return function (blob, fileName) {
    //         var url = window.URL.createObjectURL(blob);
    //         a.href = url;
    //         a.download = "tesst.wav";
    //         a.click();
    //         window.URL.revokeObjectURL(url);
    //     // };
    // };

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source === this.waveEditor) {
            if (eventName === "selchange") {
                const start = Math.min(this.waveEditor.selectionStart, this.waveEditor.selectionEnd);
                const end = Math.max(this.waveEditor.selectionStart, this.waveEditor.selectionEnd);
                this.waveScroll.setSelection(start, end);
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

    // mounted() {
    //     console.log("MOUNTIN RCORDINPANL", this.props)
    //     this.document.addEventListener("change", this.onUpdateFromDocument)
    // }

    // unmounted() {
    //     console.log("UNMOUNTIN RCORDINPANL", this.props)
    //     this.document.removeEventListener("change", this.onUpdateFromDocument)
    // }

    // // panel, w/button-toolbar on top, and list below, print number of watches -> need pagination??
    
    // render() {
    //     console.log("RENDER RECORDINGPANEL")
    //     this.onUpdateFromDocument();

    //     const close = async () => {
    //         console.log("close recording")
    //     };

    //     return [
    //         // should have in app? want like global actions
    //         // modal exportview blir rendret til dom o rooted, men aldri 
    //         new ModalPanelDialog({
    //             visible: () => this.props.showExportDialog,
    //             title: "Export",
    //             content: () => [ 
    //                 // Leaks if not callback!! if not callback, must show it, then no leak; FIXT! moved props to toDom() - but cause other problems
    //                 // problem is there is not "final" destroy - after unmount its over, but unmount is tied to dom
    //                 // we know components in props? they are also skipped in the proxy; BUT WE CAN KNOW THIS? are not rooting the component but sould
    //                 // exportview is always created, but only rendered if "visible" is true, they are implicitly conditional
    //                 // et tab-component har nødvendigvis samme issue med conditionals

    //                 new ExportView({
    //                     format: "16s", // same as document? 32 something + channels, specify explicit channels and bits instead?
    //                     name: "default",
    //                     save: () => this.onExport(),
    //                     close: () => this.props.showExportDialog = false,
    //                 }, this.document)
    //             ]
    //         }),
    //         new ButtonToolbar({
    //             content: [
    //                 // <i class="hgi-stroke hgi-home-01"></i>
    //                 new Button({
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-download-04" }),
    //                         new NutzText("Export"),
    //                     ],
    //                     // click: this.onShowExport,
    //                     click: () => this.app.executeCommand("show-export-recording"),
    //                     // disabled: () => !this.props.selection,
    //                 }),

    //                 new Button({
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-copy-01" }),
    //                         new NutzText("Copy"),
    //                     ],
    //                     // click: this.onCopy,
    //                     click: () => this.app.executeCommand("copy-selection"),
    //                     disabled: () => !this.props.selection,
    //                 }),
    //                 new Button({
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-scissor-01" }),
    //                         new NutzText("Cut"),
    //                     ],
    //                     // click: this.onCut,
    //                     click: () => this.app.executeCommand("cut-selection"),
    //                     disabled: () => !this.props.selection,
    //                 }),
    //                 new Button({
    //                     content: [
    //                         // NOTE; "hgi-stroke hgi-file-paste" is buggy - has 0 width
    //                         new NutzElement("span", { className: "hgi-stroke hgi-column-insert" }),
    //                         new NutzText("Paste"),
    //                     ],
    //                     // click: this.onPaste,
    //                     click: () => this.app.executeCommand("paste-selection"),
    //                     disabled: () => false, // need global "clipboardchange" event, which is not implemented in browsers (per aug 2024)
    //                 }),

    //                 new Button({
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-crop" }),
    //                         new NutzText("Crop"),
    //                     ],
    //                     click: this.onCrop,
    //                     disabled: () => !this.props.selection,
    //                 }),

    //                 new NutzElement("div", {
    //                     className: "p-1" // spacer
    //                 }),

    //                 new Button({
    //                     // disabled: false,
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-arrow-left-double" }),
    //                         new NutzText("Undo"),
    //                     ],
    //                     click: this.onUndo,
    //                     disabled: () => this.props.historyPosition == 0
    //                 }),

    //                 new Button({
    //                     // disabled: false,
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-arrow-right-double" }),
    //                         new NutzText("Redo"),
    //                     ],
    //                     click: this.onRedo,
    //                     disabled: () => this.props.historyPosition >= this.document.document.history.length - 1
    //                 }),


    //                 new Button({
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-zoom-in-area" }),
    //                         new NutzText("Zoom"),
    //                     ],
    //                     click: this.onZoom,
    //                     disabled: () => (!this.props.selection && !this.props.zoom),
    //                 }),

    //                 new Button({
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-zoom-in-area" }),
    //                         new NutzText("+"),
    //                     ],
    //                     title: "Zoom In",
    //                     click: this.onZoomIn,
    //                     disabled: () => !this.props.zoom, // disable if viewing whole area
    //                 }),

    //                 new Button({
    //                     content: [
    //                         new NutzElement("span", { className: "hgi-stroke hgi-zoom-in-area" }),
    //                         new NutzText("-"),
    //                     ],
    //                     title: "Zoom Out",
    //                     click: this.onZoomOut,
    //                     disabled: () => !this.props.zoom, // disable if maximum zoom?
    //                 }),

    //                 new Button({
    //                     content: [
    //                         // hgi-stroke hgi-pause
    //                         new NutzElement("span", { className: "hgi-stroke hgi-next" }),
    //                         new NutzText("Play"),
    //                     ],
    //                     click: this.onPlay
    //                 }),

    //                 new Button({
    //                     content: () => [
    //                         // hgi-stroke hgi-pause
    //                         new NutzElement("span", { className: "hgi-stroke hgi-record" }),
    //                         new NutzText("Record"),
    //                     ],
    //                     click: this.onRecord
    //                 })
    //             ]
    //         }),

    //         new WaveEditorCanvas({
    //             buffers: () => this.props.buffers, // proxy whole document? or manual update somehow?
    //             playPosition: () => this.props.playPosition,
    //             selection: () => this.props.selection, // TODO; cant objects (error in type!)
    //             zoom: () => this.props.zoom,
    //             select: (ev) => {
    //                 console.log("ITS A SELECT")
    //                 this.document.setSelection(ev);
    //                 // this triggers onUpdateFromDocument which modifies selection prop, which should redraw
    //                 // this.props.selection = ev
    //             },
    //             contextmenu: (ev) => {
    //                 console.log("ITS A CTX")
    //                 const target = ev.target as Element;
    //                 // ev.offsetX
    //                 const rc = target.getBoundingClientRect()
    //                 // const rc = target.get
    //                 const pt = [ rc.left + ev.offsetX, rc.top + ev.offsetY ];

    //                 this.app.showMenu(editMenu, pt as any);
    //                 // this.app.showContextMenu(editMenu, pt as any);
    //             }
    //         }),

    //         new WaveScrollCanvas({
    //             buffers: () => this.props.buffers, // proxy whole document? or manual update somehow?
    //             playPosition: () => this.props.playPosition,
    //             selection: () => this.props.selection, // TODO; cant objects (error in type!)
    //             zoom: () => this.props.zoom,
    //             onZoom: (zoom) => {
    //                 console.log("ITS A ZOOM")
    //                 this.document.setZoom(zoom)
    //             },
    //             select: (ev) => {
    //                 console.log("ITS A SELECT")
    //                 this.document.setSelection(ev);
    //                 // this triggers onUpdateFromDocument which modifies selection prop, which should redraw
    //                 // this.props.selection = ev
    //             },
    //         }),

    //     ];
    // }
}


// class InjectorArgument<T> {
//     type: "scoped-transient" | "transient";
//     ref?: Symbol;
//     resolver: () => T;
// }

// type ke<T extends new(...args) => T> = ConstructorParameters<T>;

// class Injector {
//     registerClass<T extends object, ARGS>(cls: new(...args) => T, ...args: ARGS) {

//     }

//     createProvider() {

//     }

//     createScope() {
//         // eller i provider? -> dette er 
//         // return injector, men med lokale variabler
//     }
// }

// const container = new Injector();

// // kan vi få typene til å matche og errore hvis ikke stemmer?
// container.registerClass<RecordingPanel, ConstructorParameters<typeof RecordingPanel>>(RecordingPanel, [
//     {
//         type: "scoped-transient",
//     },
// ]);
