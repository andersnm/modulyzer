import { FormGroup, IComponent, INotify, ModalButtonBar } from '../nutz';

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

export class AudioConfiguration implements IComponent {
    parent: INotify;
    inputDeviceId;
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
        this.containerElement.tabIndex = -1;

        this.deniedForm = this.renderDenied();
        this.promptForm = this.renderPrompt();
        this.dismissedForm = this.renderDismissed();
        this.createForm();

        this.bind();

        this.containerElement.addEventListener("nutz:mounted", this.onMounted);
        this.containerElement.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.lod();
        navigator.mediaDevices.addEventListener("devicechange", this.onRefresh);
    }

    onUnmounted = () => {
        navigator.mediaDevices.removeEventListener("devicechange", this.onRefresh);
    }

    onRefresh = () => {
        this.lod();
    }

    async lod() {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const inputDevices = mediaDevices.filter(d => d.kind === "audioinput");

        if (!this.inputDeviceId) {
            // try prop, oterwise 1st
            const currentDevice = inputDevices.filter(d => d.deviceId === this.currentInputDeviceId)[0];
            this.inputDeviceId = currentDevice ? currentDevice.deviceId : inputDevices[0].deviceId;
            this.probeDevice(this.inputDeviceId);
        }

        const outputDevices = mediaDevices.filter(d => d.kind === "audiooutput");

        if (!this.outputDeviceId) {
            const currentDevice = outputDevices.filter(d => d.deviceId === this.currentOutputDeviceId)[0];
            this.outputDeviceId = currentDevice ? currentDevice.deviceId : outputDevices[0].deviceId;
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

    setPermission(permission: any) {
        // show gui for permission
        this.microphonePermission = permission;
        this.bind();
    }

    bindOutputDevices(devices: MediaDeviceInfo[]) {
        while (this.outputDevicesSelect.options.length > 0) this.outputDevicesSelect.options.remove(0);

        for (let device of devices) {
            const opt = document.createElement("option")
            opt.value = device.deviceId;
            opt.label = device.label;

            this.outputDevicesSelect.options.add(opt)
        }

        this.outputDevicesSelect.value = this.currentOutputDeviceId;
        if (this.outputDevicesSelect.options.selectedIndex == -1) {
            this.outputDevicesSelect.options.selectedIndex = 0;
            this.currentOutputDeviceId = this.outputDevicesSelect.value;
        }
    }

    bindInputDevices(devices: MediaDeviceInfo[]) {
        while (this.inputDevicesSelect.options.length > 0) this.inputDevicesSelect.options.remove(0);

        for (let device of devices) {
            const opt = document.createElement("option")
            opt.value = device.deviceId;
            opt.label = device.label;

            this.inputDevicesSelect.options.add(opt)
        }

        this.inputDevicesSelect.value = this.currentInputDeviceId;
        if (this.inputDevicesSelect.options.selectedIndex == -1) {
            this.inputDevicesSelect.options.selectedIndex = 0;
            this.currentInputDeviceId = this.inputDevicesSelect.value;
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
                    el.addEventListener("click", this.onRefresh);
                },
                document.createTextNode("Retry")
            ),
        );
    };

    renderDenied() {
        // link in chrome chrome://settings/content/siteDetails?site=http%3A%2F%2Flocalhost%3A5173
        // console.log("RENDER DENIED" + this.microphonePermission)
        return createElement("div", null, document.createTextNode("Your microphone is blocked."));
    };

    createForm() {
        this.configForm = document.createElement("div");

        this.outputDevicesSelect = document.createElement("select");
        this.outputDevicesSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.outputDevicesSelect.addEventListener("change", () => {
            this.currentOutputDeviceId = this.outputDevicesSelect.value;
        });

        const outputGroup = FormGroup("Output Device", this.outputDevicesSelect);

        this.inputDevicesSelect = document.createElement("select");
        this.inputDevicesSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.inputDevicesSelect.addEventListener("change", () => {
            this.currentInputDeviceId = this.inputDevicesSelect.value;
        });

        const inputGroup = FormGroup("Input Device", this.inputDevicesSelect);

        const modalButtonBar = new ModalButtonBar(this, this.parent);

        this.configForm.appendChild(outputGroup);
        this.configForm.appendChild(inputGroup);

        this.configForm.appendChild(modalButtonBar.getDomNode());
    }

    getDomNode(): Node {
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
}
