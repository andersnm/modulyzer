// import { ComputableModel, deepWatch, FormGroup, FormGroupRadioList, NutzComponent, NutzElement, NutzFor, NutzSlot, NutzText } from 'nutzui';
// import { Button, ButtonToolbar } from './RecordingPanel';
import { Button, ButtonToolbar, DomElement, DomText, FormGroup, IComponent, INotify } from '../nutz';

export type DomElementCallbackType = (el: HTMLElement) => void;

function createElement(tagName: string, callback: DomElementCallbackType | null, ...contents: Node[]) {
    const node = document.createElement(tagName);
    if (callback) {
        callback(node);
    }

    for (let content of contents) {
        node.appendChild(content);
    }

    return node;
}

export class AudioConfiguration implements IComponent { //} extends NutzComponent<AudioConfigurationProps> {
    parent: INotify;
    // inputDevices: { value, text }[] = [];
    inputDeviceId;
    // outputDevices: { value, text }[] = [];
    outputDeviceId;
    currentInputDeviceId;
    currentOutputDeviceId;
    microphonePermission: string = "denied";
    inputMode: string = "stereo";
    currentInputSampleRate = 44100;
    currentInputChannelCount = 2;

    containerElement: HTMLElement;
    deniedForm: HTMLElement;
    promptForm: HTMLElement;
    dismissedForm: HTMLElement;
    configForm: HTMLElement;
    outputDevicesSelect: HTMLSelectElement;
    inputDevicesSelect: HTMLSelectElement;

    constructor(parent: INotify) {
        this.parent = parent;
        this.containerElement = document.createElement("div");

        this.deniedForm = this.renderDenied();
        this.promptForm = this.renderPrompt();
        this.dismissedForm = this.renderDismissed();
        this.createForm();

        this.bind();
        this.lod();
    }

    async lod() {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const inputDevices = mediaDevices.filter(d => d.kind === "audioinput").map(d => ({ text: d.label, value: d.deviceId }));

        if (!this.inputDeviceId) {
            // try prop, oterwise 1st
            const currentDevice = inputDevices.filter(d => d.value === this.currentInputDeviceId)[0];
            this.inputDeviceId = currentDevice ? currentDevice.value : inputDevices[0].value;
            this.probeDevice(this.inputDeviceId);
        }

        const outputDevices = mediaDevices.filter(d => d.kind === "audiooutput").map(d => ({ text: d.label, value: d.deviceId }));

        if (!this.outputDeviceId) {
            const currentDevice = outputDevices.filter(d => d.value === this.currentOutputDeviceId)[0];
            this.outputDeviceId = currentDevice ? currentDevice.value : outputDevices[0].value;
        }

        const permission = await navigator.permissions.query({name: "microphone" as PermissionName});
        this.microphonePermission = permission.state;

        this.bindOutputDevices(outputDevices)
        this.bindInputDevices(inputDevices)

        this.bind();
    }

    async probeDevice(inputDeviceId) {
        const stream = await navigator.mediaDevices.getUserMedia({audio: {advanced: [{ deviceId: inputDeviceId}]}, video: false});
        const tracks = stream.getAudioTracks();
        // console.log("probing", tracks[0], tracks[0].getCapabilities())
        const capabilities = tracks[0].getCapabilities();
        this.currentInputSampleRate = capabilities.sampleRate.max;
        this.currentInputChannelCount = capabilities.channelCount.max;
        // const sampleRate = caps.sampleRate;
    };


    // async mounted() {
    //     // this.dispatchChangeDevice();
    //     this.lod();
    // }

    // unmounted(window: NutzPlatform) {
    //     // should leave device as it was (unless confirmed)
    // }

    // onConfirm = () => {
    //     this.dispatch(this.props, "confirm", { 
    //         inputDeviceId: this.state.inputDeviceId,
    //         outputDeviceId: this.state.outputDeviceId,
    //         inputMode: this.state.inputMode,
    //     })
    // };

    refresh = () => {
        // we can probe in te ui - unless we want to do someting more fancy
        // this.parent.notify(this, "refresh-devices");
        // this.lod();
        // this.dispatch(this.props, "refresh");
    };

    // onChangeInputDevice = (e: Event) => {
    //     this.state.inputDeviceId = (e.target as HTMLSelectElement).value
    //     this.probeDevice(this.state.inputDeviceId);
    //     // this.dispatchChangeDevice();
    // };

    // onChangeOutputDevice = (e: Event) => {
    //     this.state.outputDeviceId = (e.target as HTMLSelectElement).value
    //     // this.dispatchChangeDevice();
    // };

    // dispatchChangeDevice() {
    //     this.dispatch(this.props, "change", { 
    //         inputDeviceId: this.props.currentInputDeviceId,
    //         outputDeviceId: this.props.currentOutputDeviceId,
    //         inputMode: this.props.inputMode,
    //     });
    // }

    setPermission(permission: any) {
        // show gui for permission
        this.microphonePermission = permission;
        this.bind();
    }

    bindOutputDevices(devices) {
        while (this.outputDevicesSelect.options.length > 0) this.outputDevicesSelect.options.remove(0);

        for (let device of devices) {
            const opt = document.createElement("option")
            opt.value = device.value;
            opt.label = device.text;

            this.outputDevicesSelect.options.add(opt)
        }

        this.outputDevicesSelect.value = this.currentOutputDeviceId;
        if (this.outputDevicesSelect.options.selectedIndex == -1) {
            this.outputDevicesSelect.options.selectedIndex = 0;
            this.currentOutputDeviceId = this.outputDevicesSelect.value;
            // console.log("VVout", this.currentOutputDeviceId)
        }
    }

    bindInputDevices(devices) {
        while (this.inputDevicesSelect.options.length > 0) this.inputDevicesSelect.options.remove(0);

        for (let device of devices) {
            const opt = document.createElement("option")
            opt.value = device.value;
            opt.label = device.text;

            this.inputDevicesSelect.options.add(opt)
        }

        this.inputDevicesSelect.value = this.currentInputDeviceId;
        if (this.inputDevicesSelect.options.selectedIndex == -1) {
            this.inputDevicesSelect.options.selectedIndex = 0;
            this.currentInputDeviceId = this.inputDevicesSelect.value;
            // console.log("VVin", this.currentInputDeviceId)
        }
    }

    renderPrompt() {
        return createElement("div", null, document.createTextNode("Please allow to use your microphone"));
    };

    renderDismissed() {
        return createElement("div", null,
            document.createTextNode("Please allow to use your microphone"),
            createElement("button", (el) => 
                {
                    el.addEventListener("click", () => this.refresh());
                },
                document.createTextNode("Retry")
            ),
        );
    };

    renderDenied() {
        // link in chrome chrome://settings/content/siteDetails?site=http%3A%2F%2Flocalhost%3A5173
        // console.log("RENDER DENIED" + this.microphonePermission)
        // denne vises også etter den er endret
        return createElement("div", null, document.createTextNode("Your microphone is blocked."));
    };

    createForm() {
        // would be cool to have a live meter for the selected input device, maybe global volume, view samplerate
        // problem 1; AudioConfiguration blir unmounted for tidlig?
        // problem 2; den watcher props som hører til andre komponenter (kan sikkert fikses med div3, men ->?? skjuler vi et problem da)

        this.configForm = document.createElement("div");

        this.outputDevicesSelect = document.createElement("select");
        this.outputDevicesSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.outputDevicesSelect.addEventListener("change", () => {
            this.currentOutputDeviceId = this.outputDevicesSelect.value;
            // console.log("VVout", this.currentOutputDeviceId)
        });

        const outputGroup = FormGroup("Output Device", this.outputDevicesSelect);

        this.inputDevicesSelect = document.createElement("select");
        this.inputDevicesSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.inputDevicesSelect.addEventListener("change", () => {
            this.currentInputDeviceId = this.inputDevicesSelect.value;
            // console.log("VVin", this.currentInputDeviceId)
        });

        const inputGroup = FormGroup("Input Device", this.inputDevicesSelect);

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

        // const okButton = Button();
        // okButton.textContent = "OK";
        // okButton.addEventListener("click", () => {
        //     // endDialog
            
        // });

        // const cancelButton = Button();
        // cancelButton.textContent = "Cancel";
        // cancelButton.addEventListener("click", () => {
        //     // endDialog
        //     this.parent.notify(this, "cancel");
        // });

        // const buttonContainer = document.createElement("div");
        // buttonContainer.appendChild(okButton);
        // buttonContainer.appendChild(cancelButton);

        this.configForm.appendChild(outputGroup);
        this.configForm.appendChild(inputGroup);

        this.configForm.appendChild(buttonContainer);

        // return new DomElement("div", (el) => {
        //         el.className = "";
        //     },
        //     new DomText("I AM TEXT! SUOLD B FORM")
        //     // new FormGroup("Output Device", outputDropdown)
        //     //     new FormGroup({ 
        //     //         label: "Output Device", 
        //     //         input: [
        //     //             new NutzElement("select", {
        //     //                 className: "w-full rounded-lg p-1 bg-neutral-800",
        //     //                 value: () => this.props.currentOutputDeviceId,
        //     //                 content: () => [
        //     //                     new NutzFor({
        //     //                         items: () => this.state.outputDevices,
        //     //                         itemCallback: (item: { text, value }) => {
        //     //                             return new NutzElement("option", { 
        //     //                                 value: item.value,
        //     //                                 content: () => new NutzText(item.text)
        //     //                             });
        //     //                         }
        //     //                     }),
        //     //                 ],
        //     //                 change: this.onChangeOutputDevice
        //     //             })
        //     //         ],
        //     //     }),
        //     //     new FormGroup({ 
        //     //         label: "Input Device", 
        //     //         input: () => [
        //     //             new NutzElement("select", {
        //     //                 className: "w-full rounded-lg p-1 bg-neutral-800",
        //     //                 value: () => this.props.currentInputDeviceId,
        //     //                 content: () => [
        //     //                     new NutzFor({
        //     //                         items: () => this.state.inputDevices, 
        //     //                         itemCallback: (item: { text, value }) => {
        //     //                             return new NutzElement("option", { 
        //     //                                 value: item.value,
        //     //                                 content: () => [
        //     //                                     new NutzText(item.text)
        //     //                                 ],
        //     //                             })
        //     //                         },
        //     //                     })
        //     //                 ],
        //     //                 change: this.onChangeInputDevice
        //     //             }),
        //     //             new NutzElement("div", {
        //     //                 className: "text-xs",
        //     //                 content: () => [
        //     //                     new NutzText(() => "Sample Rate: " + this.state.currentInputSampleRate + "hz, Channels: " + this.state.currentInputChannelCount ),
        //     //                 ],
        //     //             }),
        //     //         ],
        //     //     }),

        //     //     // Record stereo, left only, right only
        //     //     new FormGroupRadioList({ 
        //     //         label: "Record Channels", 
        //     //         name: "recordingChannels",
        //     //         value: () => this.state.inputMode,
        //     //         items: [
        //     //             {
        //     //                 text: "Stereo",
        //     //                 value: "stereo",
        //     //             },
        //     //             {
        //     //                 text: "Left only",
        //     //                 value: "left"
        //     //             },
        //     //             {
        //     //                 text: "Right only",
        //     //                 value: "right"
        //     //             },
        //     //         ],
        //     //         change: (e: string) => { 
        //     //             this.state.inputMode = e as any;
        //     //             console.log("Radio", e);
        //     //         }
        //     //     }),

        //     //     new ButtonToolbar({
        //     //         content: [
        //     //             new Button({
        //     //                 content: () => [ new NutzText("Refresh") ],
        //     //                 click: () => this.refresh(),
        //     //             }),
        //     //             new Button({
        //     //                 content: () => [ new NutzText("OK") ],
        //     //                 click: () => this.onConfirm(),
        //     //             }),
        //     //         ],
        //     //     })

        //     //     // button(this, {
        //     //     //     className: "font-bold px-1 mx-1 border-2 rounded",
        //     //     //     content: text(this, "Refresh")
        //     //     // }, {
        //     //     //     click: this.refresh
        //     //     // }),
        //     //     // button(this, {
        //     //     //     className: "font-bold px-1 mx-1 border-2 rounded",
        //     //     //     content: text(this, "OK")
        //     //     // }, {
        //     //     //     click: this.onConfirm
        //     //     // })

        //     //     // component(this, FormGroup, { label: "Input Device", input: input(this, { type: "text"}) } ),
        //     // ]}
        // );
    }

    getDomNode(): Node {
        // something that re-renders when microphonePermission changes
        // vi har en refresh-button på noen av permissions -> trigger re-render
        // const form = this.renderPrompt();

        // TODO; forward close/mount/detach whatever++ we proxy this now, but should have had parent/container element
        return this.containerElement;
    }

    bind() {
        while (this.containerElement.childNodes.length > 0) this.containerElement.removeChild(this.containerElement.lastChild);

        switch (this.microphonePermission) {
            case "denied":
                this.containerElement.appendChild(this.deniedForm);
                break;
            case "dismissed":
                this.containerElement.appendChild(this.dismissedForm);
                break;
            case "prompt":
                this.containerElement.appendChild(this.promptForm);
                break;
            default:
                this.containerElement.appendChild(this.configForm);
                break;
        }
    }

    // render() {
    //     return [
    //         new NutzSlot(() => {
    //             if (this.state.microphonePermission === "prompt") {
    //                 return this.renderPrompt();
    //             } else
    //             if (this.state.microphonePermission === "dismissed") {
    //                 return this.renderDismissed();
    //             } else
    //             if (this.state.microphonePermission === "denied") {
    //                 return this.renderDenied();
    //             } else {
    //                 return this.renderForm();
    //             }
    //         })
    //     ]
    // }
}
