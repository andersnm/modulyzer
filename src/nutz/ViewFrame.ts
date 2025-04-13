// A container frame with action buttons and the actual view. Forwards focus to the view.

import { ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { ButtonToolbar, ButtonToolbarType } from "./StandardStuff";

export class ViewFrame implements IComponent {
    cmdhost: ICommandHost;
    container: HTMLElement;
    buttonBar: HTMLElement;
    content: HTMLElement;

    constructor(cmdhost: ICommandHost) {
        this.cmdhost = cmdhost;
        this.content = document.createElement("div");

        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col", "w-full", "h-full");
        this.container.tabIndex = -1;
        this.buttonBar = ButtonToolbar(cmdhost, []);

        this.container.appendChild(this.buttonBar);
        this.container.appendChild(this.content);

        this.container.addEventListener("focus", this.onFocus)
    }

    onFocus = () => {
        this.content.focus();
    };

    setToolbar(buttons: ButtonToolbarType[]) {
        const newButtonBar = ButtonToolbar(this.cmdhost, buttons);
        this.container.replaceChild(newButtonBar, this.buttonBar);
        this.buttonBar = newButtonBar;
    }

    setView(element: HTMLElement) {
        this.container.replaceChild(element, this.content);
        this.content = element;
    }

    getDomNode(): Node {
        return this.container;
    }
}
