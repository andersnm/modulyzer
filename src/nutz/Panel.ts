import { IComponent } from "./IComponent";
import { HFlex, VFlex, VOutset } from "./StandardStuff";

export class Panel {
    outer: HTMLElement;

    constructor(title: IComponent, right: IComponent, content: IComponent) {
        this.outer = VFlex(undefined, ["x-panel", "flex-1", "bg-neutral-600", "rounded-lg"]);

        const topOuter = HFlex(undefined, "p-1");

        const topText =  document.createElement("div");
        topText.className = "grow text-white font-bold";
        topText.appendChild(title.getDomNode());

        const topRight =  document.createElement("div");
        topRight.className = "grow-0 flex";
        topRight.appendChild(right.getDomNode());

        topOuter.appendChild(topText);
        topOuter.appendChild(topRight);

        this.outer.appendChild(topOuter);
        this.outer.appendChild(VOutset(content.getDomNode(), "flex-1"));
    }

    getDomNode() {
        return this.outer;
    }
}
