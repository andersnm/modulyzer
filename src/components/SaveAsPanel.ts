import { Appl } from "../App";
import { ButtonToolbar, FormGroup, IComponent, INotify } from "../nutz";

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

        this.container = document.createElement("div");

        this.nameInput = document.createElement("input");
        this.nameInput.className = "w-full rounded-lg p-1 bg-neutral-800";
        this.nameInput.value = this.name;
        this.nameInput.addEventListener("change", () => {
            this.name = this.nameInput.value;
        });

        const nameGroup = FormGroup("Filename", this.nameInput);

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

        this.container.appendChild(nameGroup);
        this.container.appendChild(buttonContainer);
    }

    getDomNode(): Node {
        return this.container;
    }
}
