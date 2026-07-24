import { Appl } from "../App";
import { FormGroup, IComponent, VInset, ModalButtonBar } from "../nutz";

export class PatternPropertiesPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;

    nameInput: HTMLInputElement;
    lengthInput: HTMLInputElement;
    subdivisionInput: HTMLInputElement;
    swingInput: HTMLInputElement;
    swingPerBeatInput: HTMLInputElement;

    name: string;
    length: number;
    subdivision: number;
    swing: number;
    swingPerBeat: number;

    constructor(app: Appl, name: string, length: number, subdivision: number, swing: number, swingPerBeat: number) {
        this.app = app;
        this.name = name;
        this.length = length;
        this.subdivision = subdivision;
        this.swing = swing;
        this.swingPerBeat = swingPerBeat;

        this.container = VInset(undefined, [ "flex-1" , "gap-1"]);
        this.container.tabIndex = -1;

        this.nameInput = document.createElement("input");
        this.nameInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.nameInput.value = this.name;
        this.nameInput.addEventListener("change", () => {
            this.name = this.nameInput.value;
        });

        const nameGroup = FormGroup("Name", this.nameInput);

        this.lengthInput = document.createElement("input");
        this.lengthInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.lengthInput.type = "number";
        this.lengthInput.min = "1";
        this.lengthInput.max = "1024";
        this.lengthInput.valueAsNumber = this.length;
        this.lengthInput.addEventListener("change", () => {
            this.length = this.lengthInput.valueAsNumber;
        });

        const lengthGroup = FormGroup("Length/Rows", this.lengthInput);

        this.subdivisionInput = document.createElement("input");
        this.subdivisionInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.subdivisionInput.type = "number";
        this.subdivisionInput.min = "1";
        this.subdivisionInput.max = "16";
        this.subdivisionInput.valueAsNumber = this.subdivision;
        this.subdivisionInput.addEventListener("change", () => {
            this.subdivision = this.subdivisionInput.valueAsNumber;
        });

        const subdivisionGroup = FormGroup("Subdivision", this.subdivisionInput);

        this.swingInput = document.createElement("input");
        this.swingInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.swingInput.type = "number";
        this.swingInput.min = "1";
        this.swingInput.max = "99";
        this.swingInput.valueAsNumber = this.swing;
        this.swingInput.addEventListener("change", () => {
            this.swing = this.swingInput.valueAsNumber;
        });

        const swingGroup = FormGroup("Swing", this.swingInput);


        this.swingPerBeatInput = document.createElement("input");
        this.swingPerBeatInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.swingPerBeatInput.type = "number";
        this.swingPerBeatInput.min = "1";
        this.swingPerBeatInput.max = "4";
        this.swingPerBeatInput.valueAsNumber = this.swingPerBeat;
        this.swingPerBeatInput.addEventListener("change", () => {
            this.swingPerBeat = this.swingPerBeatInput.valueAsNumber;
        });

        const swingPerBeatGroup = FormGroup("Swing Per Beat", this.swingPerBeatInput);

        const modalButtonBar = new ModalButtonBar(this.app);

        this.container.appendChild(nameGroup);
        this.container.appendChild(lengthGroup);
        this.container.appendChild(subdivisionGroup);
        this.container.appendChild(swingGroup);
        this.container.appendChild(swingPerBeatGroup);
        this.container.appendChild(modalButtonBar.getDomNode());
    }

    getDomNode(): Node {
        return this.container;
    }
}
