import { Appl } from "../App";
import { FormGroup, IComponent, VInset, ModalButtonBar } from "../nutz";

export class InstrumentFactoryPicker implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: ModalButtonBar;

    instrumentSelect: HTMLSelectElement;
    pinSelect: HTMLSelectElement;

    instrumentFactoryIndex: number = -1;

    constructor(app: Appl) {
        this.app = app;
        this.container = VInset(undefined, [ "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.instrumentSelect = document.createElement("select");
        this.instrumentSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.instrumentSelect.addEventListener("change", () => {
            this.instrumentFactoryIndex = parseInt(this.instrumentSelect.value);
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
        for (let instrument of this.app.instrumentFactories) {
            var option = document.createElement("option");
            option.text = instrument.identifier;
            option.value = index.toString();

            this.instrumentSelect.options.add(option);
            index++;
        }

        if (this.instrumentFactoryIndex === -1 && this.instrumentSelect.options.length > 0) {
            this.instrumentFactoryIndex = 0;
            this.instrumentSelect.value = "0";
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
