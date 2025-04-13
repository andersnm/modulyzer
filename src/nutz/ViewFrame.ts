// A container frame with action buttons and the actual view. Forwards focus to the view.

import { CommandHost, formatHotkey, ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { ButtonToolbar, ButtonToolbarType } from "./StandardStuff";

export class ViewFrame extends CommandHost implements IComponent {
    container: HTMLElement;
    buttonBar: HTMLElement;
    content: HTMLElement;

    constructor(parent: ICommandHost) {
        super(parent);

        this.content = document.createElement("div");

        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col", "w-full", "h-full");
        this.container.tabIndex = -1;
        this.buttonBar = ButtonToolbar(this, []);

        this.container.appendChild(this.buttonBar);
        this.container.appendChild(this.content);

        this.container.addEventListener("focus", this.onFocus);
        this.container.addEventListener("keydown", this.onKeyDown);
    }

    onFocus = () => {
        const tabable = this.container.querySelector('[tabindex]');
        if (tabable && tabable instanceof HTMLElement)
            tabable.focus();
    };

    onKeyDown = (e: KeyboardEvent) => {
        const keyName = formatHotkey(e);
        const hotkeyCommand = this.hotkeys[keyName];
        // console.log(keyName)
        if (hotkeyCommand) {
            this.executeCommand(hotkeyCommand);
            e.stopPropagation();
            e.preventDefault();
        }
    };

    setToolbar(buttons: ButtonToolbarType[]) {
        const newButtonBar = ButtonToolbar(this, buttons);
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
