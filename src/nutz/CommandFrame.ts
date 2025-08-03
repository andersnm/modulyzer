import { CommandHost, formatHotkey, ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { VFlex } from "./StandardStuff";

/** 
 * Base class for a view component with a CommandHost. Implements keyboard shortcuts and focus.
 * Inherited by ViewFrame and GridFrame, which provide different ways to organize the layout in a component.
 */
export class CommandFrame extends CommandHost implements IComponent {
    container: HTMLElement;

    constructor(parent: ICommandHost) {
        super(parent);

        this.container = VFlex(undefined, [ "flex-1", "gap-1"]);
        this.container.tabIndex = -1;

        // inheriting class should do something like this:
        // this.container.appendChild(VInset(this.toolbars));
        // this.container.appendChild(VInset(this.content, "flex-1"));

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

    getDomNode(): Node {
        return this.container;
    }
}
