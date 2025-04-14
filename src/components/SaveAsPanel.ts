import { Appl } from "../App";
import { FormGroup, IComponent, INotify, Inset, ModalButtonBar } from "../nutz";

export class SaveAsPanel implements IComponent {
    app: Appl;
    parent: INotify;
    container: HTMLElement;
    buttonBar: HTMLElement;

    nameInput: HTMLInputElement;

    name: string;

    constructor(app: Appl, parent: INotify, name: string) {
        this.app = app;
        this.parent = parent;
        this.name = name;

        this.container = Inset(undefined, [ "flex-col", "flex-1" , "gap-1"]);
        this.container.tabIndex = -1;

        this.nameInput = document.createElement("input");
        this.nameInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.nameInput.value = this.name;
        this.nameInput.addEventListener("change", () => {
            this.name = this.nameInput.value;
        });

        const nameGroup = FormGroup("Filename", this.nameInput);

        const modalButtonBar = new ModalButtonBar(this, this.parent);

        this.container.appendChild(nameGroup);
        this.container.appendChild(modalButtonBar.getDomNode());
    }

    getDomNode(): Node {
        return this.container;
    }
}
