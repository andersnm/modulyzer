// // panel -> table w/recordings

// import { NutzComponent, NutzElement, NutzFor, NutzText, Panel } from "nutzui";
// import { AudioStorage } from "../audio/AudioStorage";
// import { IWaveDocument } from "../audio/WaveDocument";
// import { Button, ButtonToolbar } from "./RecordingPanel";
// import { App } from "../App";
// import { DataTable } from "./DataTable";

// export interface InstrumentsPanelProps {
//     recordings;

//     createNew: (e: MouseEvent) => void;
//     device: (e: MouseEvent) => void;
//     select: (e: IWaveDocument) => void;
// }

// export interface InstrumentsPanelEventMap {
//     createNew: MouseEvent;
//     device: MouseEvent;
//     select: CustomEvent<IWaveDocument>;
// }

// export class InstrumentsPanel extends NutzComponent<InstrumentsPanelProps> {
//     app: App;

//     constructor(model, app) {
//         super(model);
//         this.app = app;
//     }

//     async refreshFromStorage() {
//         // This becomes proxied - should not do that, keep gui and storage separate
//         const recs = [
//             {
//                 name: "ComboDelay",
//                 inputChannelCount: 1,
//             },
//             {
//                 name: "Osc",
//                 inputChannelCount: 0,
//             }
//         ];
//         this.props.recordings = recs;
//     }

//     onStorageChanged = () => {
//         this.refreshFromStorage();
//     };

//     async mounted() {
//         // this.storage.addEventListener("create-document", this.onStorageChanged);
//         // this.storage.addEventListener("update-document", this.onStorageChanged);
//         await this.refreshFromStorage();
//     }

//     unmounted() {
//         // this.storage.removeEventListener("create-document", this.onStorageChanged);
//         // this.storage.removeEventListener("update-document", this.onStorageChanged);
//     }

//     // panel, w/button-toolbar on top, and list below, print number of watches -> need pagination??
//     render() {
//         console.log("RENDERING INSTRUMENTSSPANEL!")
//         return [
//             new ButtonToolbar({
//                 content: ([
//                     new Button({
//                         content: ([
//                             new NutzElement("span", { className: "hgi-stroke hgi-plus-sign-square" }),
//                             new NutzText("New..."),
//                         ]),
//                         click: e => this.dispatch(this.props, "createNew", e),
//                     }),
//                     new Button({
//                         content: ([
//                             new NutzElement("span", { className: "hgi-stroke hgi-mic-01" }),
//                             new NutzText("Device...")
//                         ]),
//                         click: e => this.dispatch(this.props, "device", e),
//                         // click: this.events?.device
//                     }),
//                     new Button({
//                         content: ([
//                             new NutzElement("span", { className: "hgi-stroke hgi-refresh" })
//                         ]),
//                         title: "Refresh",
//                         // click: e => this.dispatch(this.props, "refresh", e),
//                         click: e => this.refreshFromStorage()
//                     }),
//                 ])
//             }),
//             new DataTable({
//                 data: () => this.props.recordings,
//                 columns: [
//                     {
//                         label: "Name",
//                         propertyName: "name"
//                     },
//                 ]
//             }),
//         ];
//     }
// }
