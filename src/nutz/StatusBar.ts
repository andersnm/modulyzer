import { IComponent } from "./IComponent";

export class StatusBar implements IComponent {
    container: HTMLDivElement;
    parts: HTMLDivElement[] = [];

    constructor() {

        this.container = document.createElement("div");
        this.container.classList.add("flex");

        // this.addPart(["flex-1", "text-neutral-300"], "Ready");
    }

    addPart(classes: string[], text: string) {
        const part = document.createElement("div")
        part.classList.add("text-neutral-300", ...classes);
        part.innerText = text;
        this.parts.push(part);
        this.container.appendChild(part);
    }

    setText(index: number, text: string) {
        this.parts[index].innerText = text;
    }

    getDomNode(): Node {
        return this.container;
    }
}
