import { IComponent } from "./IComponent";
import { Outset } from "./StandardStuff";

export class Panel {
    outer: HTMLElement;

    constructor(title: IComponent, right: IComponent, content: IComponent) {
        this.outer = document.createElement("div");
        this.outer.className = "x-panel flex flex-col flex-1 bg-neutral-600 rounded-lg";

        const topOuter = document.createElement("div");
        topOuter.className = "flex flex-row p-1";

        const topText =  document.createElement("div");
        topText.className = "grow text-white font-bold";
        topText.appendChild(title.getDomNode());

        const topRight =  document.createElement("div");
        topRight.className = "grow-0 flex";
        topRight.appendChild(right.getDomNode());

        topOuter.appendChild(topText);
        topOuter.appendChild(topRight);

        this.outer.appendChild(topOuter);
        this.outer.appendChild(Outset(content.getDomNode(), ["flex-col", "flex-1"]));
    }

    getDomNode() {
        return this.outer;
    }
}
