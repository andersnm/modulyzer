import { Appl } from "../App";
import { FormGroup, IComponent, VInset, ModalButtonBar } from "../nutz";
import { bindNoteDropdown } from "./PatternEditorHelper";

export class WavePropertiesPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;

    nameInput: HTMLInputElement;
    noteSelect: HTMLSelectElement;
    sampleRateInput: HTMLInputElement;

    name: string;
    note: number;
    sampleRate: number;

    constructor(app: Appl, name: string, note: number, sampleRate: number) {
        if (!sampleRate) {
            throw new Error("samplerate missing!")
        }
        this.app = app;
        this.name = name;
        this.note = note;
        this.sampleRate = sampleRate;

        this.container = VInset(undefined, [ "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.nameInput = document.createElement("input");
        this.nameInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.nameInput.value = this.name;
        this.nameInput.addEventListener("change", () => {
            this.name = this.nameInput.value;
        });

        const nameGroup = FormGroup("Filename", this.nameInput);

        this.noteSelect = document.createElement("select");
        this.noteSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.noteSelect.addEventListener("change", () => {
            this.note = parseInt(this.noteSelect.value);
        });

        bindNoteDropdown(this.noteSelect, this.note);

        const noteGroup = FormGroup("Note", this.noteSelect);


        this.sampleRateInput = document.createElement("input");
        this.sampleRateInput.type = "number";
        this.sampleRateInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.sampleRateInput.value = this.sampleRate.toString();
        this.sampleRateInput.addEventListener("change", () => {
            this.sampleRate = parseInt(this.sampleRateInput.value);
        });

        const sampleRateGroup = FormGroup("Sample Rate", this.sampleRateInput);

        const modalButtonBar = new ModalButtonBar(this.app);

        this.container.appendChild(nameGroup);
        this.container.appendChild(noteGroup);
        this.container.appendChild(sampleRateGroup);
        this.container.appendChild(modalButtonBar.getDomNode());
    }

    getDomNode(): Node {
        return this.container;
    }
}
