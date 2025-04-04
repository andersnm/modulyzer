import { Appl } from "../App";
import { FormGroup, IComponent, INotify, ModalButtonBar } from "../nutz";
import { bindNoteDropdown } from "./PatternEditorHelper";

export class WavePropertiesPanel implements IComponent {
    app: Appl;
    parent: INotify;
    container: HTMLElement;
    buttonBar: HTMLElement;

    nameInput: HTMLInputElement;
    noteSelect: HTMLSelectElement;

    name: string;
    note: number;

    constructor(app: Appl, parent: INotify, name: string, note: number) {
        this.app = app;
        this.parent = parent;
        this.name = name;
        this.note = note;

        this.container = document.createElement("div");
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

        const modalButtonBar = new ModalButtonBar(this, this.parent);

        this.container.appendChild(nameGroup);
        this.container.appendChild(noteGroup);
        this.container.appendChild(modalButtonBar.getDomNode());
    }

    getDomNode(): Node {
        return this.container;
    }
}
