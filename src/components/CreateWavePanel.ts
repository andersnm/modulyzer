import { FormGroup, FormGroupRadio, IComponent, INotify, Inset, ModalButtonBar } from "../nutz";
import { bindNoteDropdown } from "./PatternEditorHelper";

export class CreateWavePanel implements IComponent {
    parent: INotify;
    container: HTMLElement;
    nameInput: HTMLInputElement;
    durationInput: HTMLInputElement;
    noteSelect: HTMLSelectElement;

    name: string = "Untitled";
    duration: number = 600;
    note: number = 60;
    channels: number = 1;

    constructor(parent: INotify) {
        this.parent = parent;

        this.container= Inset(undefined, [ "flex-col", "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.nameInput = document.createElement("input");
        this.nameInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.nameInput.value = "Untitled"
        this.nameInput.addEventListener("change", () => {
            this.name = this.nameInput.value;
        });

        const nameGroup = FormGroup("Name", this.nameInput);

        this.durationInput = document.createElement("input");
        this.durationInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.durationInput.type = "number";
        this.durationInput.size = 8;
        this.durationInput.value = this.duration.toString();
        this.durationInput.addEventListener("change", () => {
            this.duration = parseInt(this.durationInput.value);
        });

        const durationGroup = FormGroup("Duration (sec)", this.durationInput);

        this.noteSelect = document.createElement("select");
        this.noteSelect.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.noteSelect.addEventListener("change", () => {
            this.note = parseInt(this.noteSelect.value);
        });

        bindNoteDropdown(this.noteSelect, this.note);

        const noteGroup = FormGroup("Note", this.noteSelect);

        const monoRadio = new FormGroupRadio("mode0", "mode", "1", "Mono", this.channels === 1);
        monoRadio.input.addEventListener("change", () => {
            this.channels = parseInt(monoRadio.input.value);
        });

        const stereoRadio = new FormGroupRadio("mode1", "mode", "2", "Stereo", this.channels === 2);
        stereoRadio.input.addEventListener("change", () => {
            this.channels = parseInt(stereoRadio.input.value);
        });

        const modeGroup = FormGroup("Mode", [ monoRadio.getDomNode(), stereoRadio.getDomNode() ]);

        const modalButtonBar = new ModalButtonBar(this, this.parent);

        this.container.appendChild(nameGroup);
        this.container.appendChild(durationGroup);
        this.container.appendChild(noteGroup);
        this.container.appendChild(modeGroup);
        this.container.appendChild(modalButtonBar.getDomNode());
    }

    getDomNode(): Node {
        return this.container;
    }
}
