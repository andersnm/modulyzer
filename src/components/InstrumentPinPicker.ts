import { Appl } from "../App";
import { PatternColumnType } from "../audio/SongDocument";
import { FormGroup, IComponent, VInset, ModalButtonBar, FormGroupRadio } from "../nutz";

export class InstrumentPinPicker implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;

    instrumentSelect: HTMLSelectElement;
    pinSelect: HTMLSelectElement;

    instrumentIndex: number = -1;
    type: PatternColumnType = "midiparameter";
    parameterName: string = null;

    constructor(app: Appl) {
        this.app = app;
        this.container = VInset(undefined, [ "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.instrumentSelect = document.createElement("select");
        this.instrumentSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.instrumentSelect.addEventListener("change", () => {
            this.instrumentIndex = parseInt(this.instrumentSelect.value);
            // console.log("VVout", this.currentOutputDeviceId)
            this.bindPins();
        });

        const instrumentGroup = FormGroup("Instrument", this.instrumentSelect);

        const noteRadio = new FormGroupRadio("type0", "type", "midinote", "Note", this.type === "midinote");
        noteRadio.input.addEventListener("change", () => {
            this.type = noteRadio.input.value as PatternColumnType;
            this.pinSelect.disabled = true;
        });

        const midiParameterRadio = new FormGroupRadio("type1", "type", "midiparameter", "Parameter", this.type === "midiparameter");
        midiParameterRadio.input.addEventListener("change", () => {
            this.type = noteRadio.input.value as PatternColumnType;
            this.pinSelect.disabled = false;
        });


        this.pinSelect = document.createElement("select");
        this.pinSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.pinSelect.addEventListener("change", () => {
            this.parameterName = this.pinSelect.value;
        });

        const parameterGroup = FormGroup("Column", [ noteRadio.getDomNode(), midiParameterRadio.getDomNode(), this.pinSelect ]);

        const modalButtonBar = new ModalButtonBar(this.app);

        this.container.appendChild(instrumentGroup);
        this.container.appendChild(parameterGroup);
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

        const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(instrument);
        const pins = playerInstrument.parameters;

        if (pins.length > 0 && !this.parameterName) {
            this.parameterName = pins[0].name;
        }

        let index = 0;
        for (let pin of pins) {
            const option = document.createElement("option");
            option.text = pin.name;
            option.value = pin.name;
            option.selected = pin.name === this.parameterName;

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

