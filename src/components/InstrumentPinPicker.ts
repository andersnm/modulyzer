import { Appl } from "../App";
import { FormGroup, IComponent, INotify, Inset, ModalButtonBar } from "../nutz";

export class InstrumentPinPicker implements IComponent {
    app: Appl;
    parent: INotify;
    container: HTMLElement;
    buttonBar: HTMLElement;

    instrumentSelect: HTMLSelectElement;
    pinSelect: HTMLSelectElement;

    instrumentIndex: number = -1;
    pinIndex: number = -1;

    constructor(app: Appl, parent: INotify) {
        this.app = app;
        this.parent = parent;
        this.container = Inset(undefined, [ "flex-col", "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.instrumentSelect = document.createElement("select");
        this.instrumentSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.instrumentSelect.addEventListener("change", () => {
            this.instrumentIndex = parseInt(this.instrumentSelect.value);
            // console.log("VVout", this.currentOutputDeviceId)
            this.bindPins();
        });

        const instrumentGroup = FormGroup("Instrument", this.instrumentSelect);

        this.pinSelect = document.createElement("select");
        this.pinSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.pinSelect.addEventListener("change", () => {
            this.pinIndex = parseInt(this.pinSelect.value)
            // this.currentOutputDeviceId = this.instrumentSelect.value;
            // console.log("VVout", this.currentOutputDeviceId)
        });

        const pinGroup = FormGroup("Pin", this.pinSelect);

        const modalButtonBar = new ModalButtonBar(this, this.parent);

        this.container.appendChild(instrumentGroup);
        this.container.appendChild(pinGroup);
        this.container.appendChild(modalButtonBar.getDomNode());

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        // this.app.song.addEventListener("createInstrument", this.onBindInstrument);
        this.bindInstruments();
        this.bindPins();
    };

    onUnmounted = () => {

    };

    bindPins() {
        while (this.pinSelect.options.length) this.pinSelect.options.remove(0);

        const instrument = this.app.song.instruments[this.instrumentIndex];

        if (!instrument) {
            return;
        }

        const factory = this.app.instrumentFactories.find(f => f.getIdentifier() === instrument.instrumentId);
        const pins = factory.getPins();

        if (pins.length > 0 && this.pinIndex === -1) {
            this.pinIndex = 0;
        }

        let index = 0;
        for (let pin of pins) {
            const option = document.createElement("option");
            option.text = pin.name;
            option.value = index.toString();
            option.selected = index === this.pinIndex;

            this.pinSelect.options.add(option);
            index++;
        }

        // console.log("this.pinSelect.value", this.pinSelect.value)
    }

    bindInstruments() {
        while (this.instrumentSelect.options.length) this.instrumentSelect.options.remove(0);

        if (this.app.song.instruments.length > 0 && this.instrumentIndex === -1) {
            this.instrumentIndex = 0;
        }

        let index = 0;
        for (let instrument of this.app.song.instruments) {
            const option = document.createElement("option");
            option.text = instrument.name + " - " + instrument.instrumentId;
            option.value = index.toString();
            option.selected = index === this.instrumentIndex;

            this.instrumentSelect.options.add(option);
            index++;
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}

