import { IComponent } from "./IComponent";

export class Panel {
    outer: HTMLElement;

    constructor(title: IComponent, right: IComponent, content: IComponent) {
        this.outer = document.createElement("div");
        this.outer.className = "flex flex-col h-full w-full";

        const topOuter = document.createElement("div");
        topOuter.className = "flex flex-row px-1 py-1 bg-neutral-600";

        const topText =  document.createElement("div");
        topText.className = "grow text-white font-bold";
        topText.appendChild(title.getDomNode());

        const topRight =  document.createElement("div");
        topRight.className = "grow-0 flex";
        topRight.appendChild(right.getDomNode());

        topOuter.appendChild(topText);
        topOuter.appendChild(topRight);

        const contentOuter = document.createElement("div");
        contentOuter.className = "h-full w-full p-1 bg-neutral-600";

        const contentInner = document.createElement("div");
        contentInner.className = "flex flex-col h-full w-full p-1 bg-neutral-800 rounded-lg overflow-auto text-white";

        contentInner.appendChild(content.getDomNode());

        contentOuter.appendChild(contentInner);

        this.outer.appendChild(topOuter);
        this.outer.appendChild(contentOuter);
    }

    getDomNode() {
        return this.outer;
    }
}
