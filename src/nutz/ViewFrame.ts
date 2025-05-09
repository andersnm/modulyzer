// A container frame with action buttons and the actual view. Forwards focus to the view.

import { CommandHost, formatHotkey, ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { HFlex, VFlex, VInset } from "./StandardStuff";

export class ViewFrame extends CommandHost implements IComponent {
    container: HTMLElement;
    toolbars: HTMLDivElement;
    content: HTMLElement;

    constructor(parent: ICommandHost) {
        super(parent);

        this.content = document.createElement("div");

        this.container = VFlex(undefined, [ "flex-1", "gap-1"]);
        this.container.tabIndex = -1;

        this.toolbars = HFlex([], ["gap-1", "flex-wrap"]);

        this.container.appendChild(VInset(this.toolbars));
        this.container.appendChild(VInset(this.content, "flex-1"));

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

    addToolbar(child: HTMLElement) {
        this.toolbars.appendChild(child);
    }

    setView(element: HTMLElement) {
        this.content.parentElement.replaceChild(element, this.content);
        this.content = element;
    }

    getDomNode(): Node {
        return this.container;
    }
}
