import { InstrumentDocument } from "../audio/SongDocument";
import { Button, IComponent } from "../nutz";

export class InstrumentDropdown implements IComponent {
    container: HTMLDivElement;
    instrumentSelect: HTMLSelectElement;
    menuButton: HTMLButtonElement;

    constructor() {
        this.container = document.createElement("div");
        this.container.classList.add("flex", "gap-1", "items-center", "flex-1");

        this.instrumentSelect = document.createElement("select");
        this.instrumentSelect.className = "flex-1 rounded-lg p-1 text-neutral-300 bg-neutral-600";

        this.menuButton = Button();
        this.menuButton.classList.add("hgi-stroke", "hgi-menu-01");

        this.container.appendChild(this.instrumentSelect);
        this.container.appendChild(this.menuButton);
    }

    setInstrument(instrument: InstrumentDocument) {
        this.instrumentSelect.value = instrument?.name??null;
    }

    bindInstruments(instruments: InstrumentDocument[]) {
        while (this.instrumentSelect.options.length > 0) this.instrumentSelect.options.remove(0);

        for (let instrument of instruments) {
            const opt = document.createElement("option")
            opt.value = instrument.name; // TODO? assume unique
            opt.label = instrument.name;
            this.instrumentSelect.options.add(opt);
        }

        if (this.instrumentSelect.options.length === 0) {
            const opt = document.createElement("option")
            opt.value = null;
            opt.label = "<no instruments using wave table>";
            opt.selected = true;
            this.instrumentSelect.options.add(opt);
            this.instrumentSelect.disabled = true;
        } else {
            this.instrumentSelect.disabled = false;
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}