
// TODO; this lists all recordings in the storage, but should first open/create a specific project and list recordings in the project

import { Appl } from "../App";
import { ButtonToolbar, DataTable, IApplication, IComponent } from "../nutz";

function formatTime(sec: number): string {
    const min = Math.floor(sec / 60);
    sec -= min * 60;
    return min + "m " + Math.floor(sec) + "s";
}

export class OpenWavePanel implements IComponent {
    // -> modal
    app: Appl;
    container: HTMLElement;
    fileList: DataTable;

    constructor(app: Appl) {
        this.app = app;

        // tabs; 
        // local storage = button to browse
        // indexdb = actual browser
        this.container = document.createElement("div");
        this.container.className = "flex flex-col";

        this.fileList = new DataTable(this);
        this.fileList.addColumn("Name", "name");
        this.fileList.addColumn("Duration", "duration");

        this.container.appendChild(this.fileList.getDomNode());
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        
    }

    async bind() {
        console.log("binding files to open");
        // const all = await this.app.storage.getAll();
        // for (let item of all) {
        //     this.fileList.addRow({
        //         name: item.name,
        //         duration: "smell"
        //     });
        // }
    }

    getDomNode(): Node {
        return this.container;
    }
}

// want open-dialog from local storage
export class RecordingsPanel implements IComponent {
    app: Appl;
    // storage: AudioStorage;
    container: HTMLElement;
    buttonBar: HTMLElement;
    list: DataTable;

    constructor(app: Appl) {
        this.app = app;
        // this.storage = storage;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col";

        this.buttonBar = ButtonToolbar([
            {
                type: "button",
                icon: "hgi-stroke hgi-plus-sign-square",
                label: "New...",
                click: () => app.executeCommand("show-create-new-recording"),
            },
            {
                type: "button",
                icon: "hgi-stroke hgi-folder",
                label: "Open...",
                click: () => app.uploadWave(),
            },
        ]);

        this.list = new DataTable(this);
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")
        // new NutzElement("td", {
        //     className: "whitespace-nowrap",
        //     content: () => [ new NutzText(item.name) ],
        // }),
        // new NutzElement("td", {
        //     content: () => [ new NutzText(formatTime(item.sampleCount / item.sampleRate)) ],
        // }),
        // new NutzElement("td", {
        //     content: () => [ new NutzText((item.sampleRate / 1000) + "khz") ],
        // }),


        this.container.appendChild(this.buttonBar);
        this.container.appendChild(this.list.getDomNode());

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async (ev) => {
        this.bind();
        this.app.song.addEventListener("createWave", this.onUpdate);
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createWave", this.onUpdate);
    };

    onUpdate = () => {
        this.bind();
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source === this.list) {
            if (eventName === "dblclick") {
                const index = args[0];
                const wave = this.app.song.waves[index];
                // app.getWaveEditor(waav)
                this.app.executeCommand("show-wave-editor", wave);
            }
        }

    }

    bind() {
        console.log("binding");
        while (this.list.getRowCount()) this.list.removeRow(0);

        for (let item of this.app.song.waves) {
            this.list.addRow({
                name: item.name,
                duration: formatTime(item.sampleCount / item.sampleRate)
            });
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}

// export class RecordingsList extends NutzComponent<RecordingsListProps> {
//     render() {
//         // can we lookup the component for each target? may be slow to lookup?

//         // go to root, then find props for looking at child nodes
//         // root = app
//         const selectSample = (item: IWaveDocument) => {
//             this.dispatch(this.props, "select", item)
//         };

//         return [
//             new NutzElement("div", {
//                 // h-full w-full rounded-lg border-4 border-neutral-700 bg-neutral-600 overflow-auto
//                 className: "h-full w-full rounded-lg rounded-lg bg-neutral-600 p-1 overflow-auto",
//                 content: () => [ 
//                     new NutzElement("table", {
//                         width: "100%",
//                         content: () => [
//                             new NutzElement("tr", {
//                                 content: () => [
//                                     new NutzElement("td", {
//                                         content: () => [ new NutzText("Name") ],
//                                     }),
//                                     new NutzElement("td", {
//                                         content: () => [ new NutzText("Duration") ],
//                                     }),
//                                     new NutzElement("td", {
//                                         content: () => [ new NutzText("Sample Rate") ],
//                                     }),
//                                 ]
//                             }),

//                             new NutzFor({
//                                 items: () => this.props.recordings, 
//                                 itemCallback: (item: IWaveDocument) => {
//                                     // kanskje html-elementene skal ta en "special" child nodes som constructor, ? 
//                                     // dvs at de blir litt mer explisitt slott - brukes så ofte at trenger eget konsept, og vil ikke ha komponent-bloat
//                                     // må se nærmere på å returnere komponenter istedet for DOM, og rendre et annet sted

//                                     // new YoluiTr(this, {}, () => RenderType)
//                                     // yolo-dom-ui = YoloDOM-UI, YoloDOMUI, YoloDomUI, 
//                                     return new NutzElement("tr", {
//                                         className: "hover:bg-neutral-400",
//                                         content: () => [
//                                             new NutzElement("td", {
//                                                 className: "whitespace-nowrap",
//                                                 content: () => [ new NutzText(item.name) ],
//                                             }),
//                                             new NutzElement("td", {
//                                                 content: () => [ new NutzText(formatTime(item.sampleCount / item.sampleRate)) ],
//                                             }),
//                                             new NutzElement("td", {
//                                                 content: () => [ new NutzText((item.sampleRate / 1000) + "khz") ],
//                                             }),
//                                         ],
//                                         click: () => selectSample(item)
//                                     });
//                                 }
//                             })
//                         ]
//                     })
//                 ]
//             })
//         ];
//     }
// } 
