import { ButtonToolbar, FormGroup, IComponent, INotify } from "../nutz";

export class CreateNewPanel implements IComponent {
    parent: INotify;
    container: HTMLElement;
    nameInput: HTMLInputElement;
    durationInput: HTMLInputElement;

    name: string = "Untitled";
    duration: number = 600;

    constructor(parent: INotify) {
        this.parent = parent;

        this.container = document.createElement("div");

        this.nameInput = document.createElement("input");
        this.nameInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.nameInput.value = "Untitled"
        this.nameInput.addEventListener("change", () => {
            this.name = this.nameInput.value;
        });

        const nameGroup = FormGroup("Name", this.nameInput);

        this.durationInput = document.createElement("input");
        this.durationInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.durationInput.type = "number";
        this.durationInput.size = 8;
        this.durationInput.value = this.duration.toString();
        this.durationInput.addEventListener("change", () => {
            this.duration = parseInt(this.durationInput.value);
        });

        const durationGroup = FormGroup("Duration (sec)", this.durationInput);

        const buttonContainer = ButtonToolbar([
            {
                type: "button",
                label: "OK",
                click: () => this.parent.notify(this, "ok"),
                icon: null,
            },
            {
                type: "button",
                label: "Cancel",
                click: () => this.parent.notify(this, "cancel"),
                icon: null,
            },
        ]);

        this.container.appendChild(nameGroup);
        this.container.appendChild(durationGroup);
        this.container.appendChild(buttonContainer);
    }

    getDomNode(): Node {
        return this.container;
    }

    // // panel, w/button-toolbar on top, and list below, print number of watches -> need pagination??
    // render() {
    //     const createNew = () => {
    //         this.dispatch(this.props, "createNew", this.props); // the backing object
    //     };

    //     const cancel = () => {
    //         this.dispatch(this.props, "cancel");
    //     };

    //     return [
    //         new FormGroup({ 
    //             label: "Name", 
    //             input: [ 
    //                 new NutzElement("input", {
    //                     className: "w-full rounded-lg p-1 bg-neutral-800",
    //                     value: () => this.props.name,
    //                     type: "text",
    //                     change: (e) => this.props.name = (e.target as HTMLInputElement).value
    //                 }),
    //             ],
    //         }),

    //         new FormGroup({ 
    //             label: "Duration (sec)", 
    //             input: [
    //                 new NutzElement("input", {
    //                     className: "text-right w-20 rounded-lg p-1 bg-neutral-800",
    //                     value: () => this.props.durationSec.toString(),
    //                     type: "number",
    //                     size: 8,
    //                     change: (e) => this.props.durationSec = parseInt((e.target as HTMLInputElement).value)
    //                 }),
    //                 new NutzElement("div", {
    //                     className: "text-xs",
    //                     content: () => [
    //                         new NutzText(() => "Sample Rate: " + this.props.sampleRate + "hz"),
    //                     ],
    //                 }),
    //             ],
    //         }),

    //         // radio - record from; stereo, left, right - TODO; separate new and record, and have stereo/mono here
    //         new FormGroupRadioList({ 
    //             label: "Channels", 
    //             name: "recordingChannels",
    //             value: () => (this.props.channelCount == 2 ? "stereo" : "mono"),
    //             items: [
    //                 {
    //                     text: "Stereo",
    //                     value: "stereo",
    //                 },
    //                 {
    //                     text: "Mono",
    //                     value: "mono"
    //                 }
    //             ],
    //             change: (e: string) => { 
    //                 this.props.channelCount = e == "stereo" ? 2 : 1;
    //                 console.log("Radio", e)
    //             }
    //         }),
    //         new ButtonToolbar({
    //             content: [
    //                 new Button({
    //                     content: [ new NutzText("Create") ],
    //                     click: e => createNew()
    //                 }),
    //                 new Button({
    //                     content: [ new NutzText("Cancel") ],
    //                     // content: new YoluiSlot(() => text(this, "Cancel")),
    //                     click: e => cancel()
    //                 })
    //             ]
    //         })
    //     ];
    // }
}
