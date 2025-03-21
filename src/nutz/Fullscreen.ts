import { IComponent } from "./IComponent";

export class FullScreen {
    outer: HTMLElement;

    constructor(content: IComponent) {
        this.outer = document.createElement("div");
        this.outer.className = "flex flex-col h-full w-full overflow-hidden";
        this.outer.appendChild(content.getDomNode());
    }

    getDomNode() {
        return this.outer;
    }
}
