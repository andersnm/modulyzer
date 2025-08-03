// A container frame with action buttons and the actual view. Forwards focus to the view.

import { CommandFrame } from "./CommandFrame";
import { CommandHost, formatHotkey, ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { HFlex, VFlex, VInset } from "./StandardStuff";

export class ViewFrame extends CommandFrame {
    toolbars: HTMLDivElement;
    content: HTMLElement;

    constructor(parent: ICommandHost) {
        super(parent);

        this.content = document.createElement("div");
        this.toolbars = HFlex([], ["gap-1", "flex-wrap"]);

        this.container.appendChild(VInset(this.toolbars));
        this.container.appendChild(VInset(this.content, "flex-1"));
    }

    addToolbar(child: HTMLElement) {
        this.toolbars.appendChild(child);
    }

    setView(element: HTMLElement) {
        this.content.parentElement.replaceChild(element, this.content);
        this.content = element;
    }
}
