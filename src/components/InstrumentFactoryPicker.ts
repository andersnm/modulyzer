import { Appl } from "../App";
import { ButtonToolbar, FormGroup, IComponent, INotify } from "../nutz";

export class InstrumentFactoryPicker implements IComponent {
    app: Appl;
    parent: INotify;
    container: HTMLElement;
    buttonBar: HTMLElement;

    instrumentSelect: HTMLSelectElement;
    pinSelect: HTMLSelectElement;

    instrumentFactoryIndex: number = -1;

    constructor(app: Appl, parent: INotify) {
        this.app = app;
        this.parent = parent;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";

        this.instrumentSelect = document.createElement("select");
        this.instrumentSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.instrumentSelect.addEventListener("change", () => {
            this.instrumentFactoryIndex = parseInt(this.instrumentSelect.value);
        });

        const instrumentGroup = FormGroup("Instrument", this.instrumentSelect);

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

        this.container.appendChild(instrumentGroup);
        this.container.appendChild(buttonContainer);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = () => {
        // this.app.song.addEventListener("createInstrument", this.onBindInstrument);
        this.bindInstruments();
    };

    onUnmounted = () => {

    };

    bindInstruments() {
        while (this.instrumentSelect.options.length) this.instrumentSelect.options.remove(0);

        let index = 0;
        for (let instrument of this.app.instrumentFactories) {
            var option = document.createElement("option");
            option.text = instrument.getIdentifier();
            option.value = index.toString();

            this.instrumentSelect.options.add(option);
            index++;
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}

