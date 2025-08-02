import { Appl } from "../App";
import { FormGroup, IComponent, VInset, ModalButtonBar } from "../nutz";

export class InstrumentPicker implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: ModalButtonBar;

    instrumentSelect: HTMLSelectElement;
    pinSelect: HTMLSelectElement;

    instrumentIndex: number = -1;

    constructor(app: Appl) {
        this.app = app;
        this.container = VInset(undefined, [ "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.instrumentSelect = document.createElement("select");
        this.instrumentSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.instrumentSelect.addEventListener("change", () => {
            this.instrumentIndex = parseInt(this.instrumentSelect.value);
            this.buttonBar.okButton.disabled = false;
        });

        const instrumentGroup = FormGroup("Instrument", this.instrumentSelect);

        this.buttonBar = new ModalButtonBar(this.app);

        this.container.appendChild(instrumentGroup);
        this.container.appendChild(this.buttonBar.getDomNode());

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        this.bindInstruments();
    };

    onUnmounted = () => {
    };

    bindInstruments() {
        while (this.instrumentSelect.options.length) this.instrumentSelect.options.remove(0);

        let index = 0;
        for (let instrument of this.app.song.instruments) {
            var option = document.createElement("option");
            option.text = instrument.name;
            option.value = index.toString();
            option.selected = this.instrumentIndex === index;

            this.instrumentSelect.options.add(option);
            index++;
        }

        if (this.instrumentIndex === -1 && this.instrumentSelect.options.length > 0) {
            this.instrumentIndex = 0;
            this.instrumentSelect.value = "0";
        }

        if (this.instrumentIndex === -1) {
            this.buttonBar.okButton.disabled = true;
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
