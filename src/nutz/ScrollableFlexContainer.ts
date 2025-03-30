import { domAppendNodes } from "./DomUtil";
import { IComponent } from "./IComponent";

export class ScrollableFlexContainer implements IComponent {
    container: HTMLElement;
    scrollContainer: HTMLElement;

    constructor(child: Node|Node[]) {

        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col", "w-full", "h-full", "relative", "overflow-auto");

        this.scrollContainer  = document.createElement("div");
        this.scrollContainer.classList.add("flex", "flex-col", "min-w-full", "absolute");

        this.container.appendChild(this.scrollContainer);

        domAppendNodes(this.scrollContainer, child);
    }

    getDomNode(): Node {
        return this.container;
    }
}