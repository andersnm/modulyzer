import { Appl } from "../App";
import { FormGroup, IComponent, VInset, ModalButtonBar } from "../nutz";

export class SaveAsPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;

    nameInput: HTMLInputElement;

    name: string;

    constructor(app: Appl, name: string) {
        this.app = app;
        this.name = name;

        this.container = VInset(undefined, [ "flex-1" , "gap-1"]);
        this.container.tabIndex = -1;

        this.nameInput = document.createElement("input");
        this.nameInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.nameInput.value = this.name;
        this.nameInput.addEventListener("change", () => {
            this.name = this.nameInput.value;
        });

        const nameGroup = FormGroup("Filename", this.nameInput);

        const modalButtonBar = new ModalButtonBar(this.app);

        this.container.appendChild(nameGroup);
        this.container.appendChild(modalButtonBar.getDomNode());
    }

    getDomNode(): Node {
        return this.container;
    }
}
