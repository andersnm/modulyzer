import { Appl } from '../App';
import { FormGroup, IComponent, VInset, ModalButtonBar } from '../nutz';

export type DomElementCallbackType = (el: HTMLElement) => void;

interface DeviceInfo {
    sampleRate: ULongRange;
    channelCount: ULongRange;
}

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
    app: Appl;
    cancelable: boolean = true;
    currentInputDeviceId: string;
    currentOutputDeviceId: string;
    microphonePermission: string = "denied";
    inputMode: string = "stereo";
    currentInputSampleRate = 44100;
    currentInputChannelCount = 2;
    latencySec = 0.5;
    deviceCapabilities: Map<string, DeviceInfo> = new Map();

    containerElement: HTMLElement;
    deniedForm: HTMLElement;
    promptForm: HTMLElement;
    dismissedForm: HTMLElement;
    configForm: HTMLElement;
    outputDevicesSelect: HTMLSelectElement;
    inputDevicesSelect: HTMLSelectElement;
    latencySelect: HTMLSelectElement;
    buttonBar: ModalButtonBar;

    constructor(app: Appl) {
        this.app = app;
        this.containerElement = VInset(undefined, "flex-1");
        this.containerElement.tabIndex = -1;

        this.deniedForm = this.renderDenied();
        this.promptForm = this.renderPrompt();
        this.dismissedForm = this.renderDismissed();
        this.createForm();

        this.bind();
        this.bindButtons();

        this.containerElement.addEventListener("nutz:mounted", this.onMounted);
        this.containerElement.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.bind();
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
        const outputDevices = mediaDevices.filter(d => d.kind === "audiooutput");

        for (let inputDevice of inputDevices) {
            const caps = await this.probeDevice(inputDevice.deviceId);
            this.deviceCapabilities.set(inputDevice.deviceId, caps);
        }

        for (let outputDevice of outputDevices) {
            const caps = await this.probeDevice(outputDevice.deviceId);
            this.deviceCapabilities.set(outputDevice.deviceId, caps);
        }

        const permission = await navigator.permissions.query({name: "microphone" as PermissionName});
        this.microphonePermission = permission.state;

        this.bindOutputDevices(outputDevices)
        this.bindInputDevices(inputDevices)
        this.bindLatency();
        this.bindButtons();

        this.bind();
    }

    bindButtons() {
        const hasOptions = this.outputDevicesSelect.options.length > 0;
        this.buttonBar.cancelButton.disabled = !this.cancelable || !hasOptions;
        this.buttonBar.okButton.disabled = !this.currentOutputDeviceId || !hasOptions;
    }

    async probeDevice(inputDeviceId: string) {
        const stream = await navigator.mediaDevices.getUserMedia({audio: {advanced: [{ deviceId: inputDeviceId}]}, video: false});
        const tracks = stream.getAudioTracks();
        // console.log("probing", tracks[0], tracks[0].getCapabilities())
        const capabilities = tracks[0].getCapabilities();
        return {
            sampleRate: capabilities.sampleRate,
            channelCount: capabilities.channelCount,
        } as DeviceInfo;
    };

    bindLatency() {
        while (this.latencySelect.options.length > 0) this.latencySelect.options.remove(0);

        const capabilities = this.deviceCapabilities.get(this.currentOutputDeviceId);
        const sampleRate = capabilities.sampleRate.max;

        const latencies = [ 128, 256, 512, 1024, 2048, 0.125 * sampleRate, 0.25 * sampleRate, 0.5 * sampleRate ];

        for (let latency of latencies) {
            const opt = document.createElement("option")
            opt.value = (latency / sampleRate).toFixed(5);
            opt.label = (latency / sampleRate * 1000).toFixed(1) + "ms (" + latency + ")";

            this.latencySelect.options.add(opt)
        }

        this.latencySelect.value = this.latencySec.toFixed(5);

        if (this.latencySelect.options.selectedIndex == -1) {
            this.latencySelect.options.selectedIndex = 5; // the index of 0.125 in latencies array
            this.latencySec = 0.125;
        }
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
        this.configForm.classList.add("flex", "flex-col", "flex-1", "gap-1")

        this.outputDevicesSelect = document.createElement("select");
        this.outputDevicesSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.outputDevicesSelect.addEventListener("change", () => {
            this.currentOutputDeviceId = this.outputDevicesSelect.value;
            this.bindButtons();
        });

        const outputGroup = FormGroup("Output Device", this.outputDevicesSelect);

        this.inputDevicesSelect = document.createElement("select");
        this.inputDevicesSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.inputDevicesSelect.addEventListener("change", () => {
            this.currentInputDeviceId = this.inputDevicesSelect.value;
        });

        const inputGroup = FormGroup("Input Device", this.inputDevicesSelect);

        this.latencySelect = document.createElement("select");
        this.latencySelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.latencySelect.addEventListener("change", () => {
            this.latencySec = parseFloat(this.latencySelect.value);
        });

        const latencyGroup = FormGroup("Latency", this.latencySelect);

        this.buttonBar = new ModalButtonBar(this.app);

        this.configForm.appendChild(outputGroup);
        this.configForm.appendChild(inputGroup);
        this.configForm.appendChild(latencyGroup);

        this.configForm.appendChild(this.buttonBar.getDomNode());
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
