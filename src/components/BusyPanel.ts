import { Appl } from "../App";
import { IComponent, VInset } from "../nutz";

export class BusyPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    label: HTMLElement;

    constructor(app: Appl, text: string) {
        this.app = app;

        this.container = VInset(undefined, [ "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.label = document.createElement("div");
        this.label.classList.add("text-white");
        this.label.innerText = text;

        this.container.appendChild(this.label);
    }

    getDomNode(): Node {
        return this.container;
    }
}
