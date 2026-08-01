// // panel -> table w/recordings

// import { button, component, div, div2, FormGroup, FormGroupRadioList, input, label, Panel, select, table, td, text, tr, yoloFor, YoluiComponent } from "yolui";
// import { Button, ButtonToolbar } from "./RecordingPanel";

// export interface StartRecordingDialogProps {
//     name: string;
//     durationSec: number;
//     currentInputDeviceCapabilities?: MediaTrackCapabilities;
//     // channel mappings, record left or right, or both - depending on target channels
// }

// export interface StartRecordingDialogEventMap {
//     // createNew: CustomEvent<CreateNewPanelProps>;
//     // cancel: CustomEvent;
// }

// export class StartRecordingDialog extends YoluiComponent<StartRecordingDialogProps, StartRecordingDialogEventMap> {

//     // panel, w/button-toolbar on top, and list below, print number of watches -> need pagination??
//     // panel skal komme fra DialogFrame, slik at kan dockes i mainframe-tabs eller hvor som helst
//     // Dette er StartRecordingForm -> som wrappes i en dialog frame i en dialog
//     render() {
//         return component(this, Panel, {
//             // cssClass: "flex-1 min-w-48 min-h-0",
//             title: text(this, "Start Recording"),
//             titleRight: text(this, ""),
//             content: [
//                 // component(this, FormGroup, { 
//                 //     label: "Name", 
//                 //     input: input(this, {
//                 //         className: "w-full rounded-lg p-1 bg-neutral-700",
//                 //         value: () => this.props.name,
//                 //         type: "text",
//                 //     }, {
//                 //         change: (e) => this.props.name = (e.target as HTMLInputElement).value
//                 //     })
//                 // }),

//                 // component(this, FormGroup, { 
//                 //     label: "Duration (sec)", 
//                 //     input: [
//                 //         input(this, {
//                 //             className: "text-right w-20 rounded-lg p-1 bg-neutral-700",
//                 //             value: () => this.props.durationSec.toString(),
//                 //             type: "number",
//                 //             size: 8,
//                 //         }, {
//                 //             change: (e) => this.props.durationSec = parseInt((e.target as HTMLInputElement).value)
//                 //         }),
//                 //         div2(this, {
//                 //             className: "text-xs",
//                 //             content: text(this, () => "Sample Rate: " + this.props.currentInputDeviceCapabilities?.sampleRate?.max + "hz"),
//                 //         }),
//                 //     ],
//                 // }),
//                 // TODO; outset with sample rate, device channels

//                 // radio - record from; stereo, left, right - TODO; separate new and record, and have stereo/mono here
//                 component(this, FormGroupRadioList, { 
//                     label: "Recording Channels", 
//                     name: "recordingChannels",
//                     value: "mono",
//                     items: [
//                         {
//                             text: "Stereo",
//                             value: "stereo"
//                         },
//                         {
//                             text: "Left",
//                             value: "left"
//                         },
//                         {
//                             text: "Right",
//                             value: "right"
//                         }
//                     ],
//                 }, {
//                     change: (e: CustomEvent<string>) => { console.log("Radio", e.detail)}
//                 }),
//                 component(this, ButtonToolbar, {
//                     content: [
//                         component(this, Button, {
//                             content: text(this, "🔴 Start recording")
//                         }, {
//                             // click: createNew
//                         }),
//                         component(this, Button, {
//                             content: text(this, "Cancel")
//                         }, {
//                             // click: cancel
//                         })
//                     ]
//                 })
//             ]
//         });
//     }
// }
