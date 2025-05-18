import { ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { Button, ButtonToolbarType, HFlex, isButtonToolbarButton } from "./StandardStuff";

export class CommandButtonBar implements IComponent {
    container: HTMLDivElement;
    cmdHost: ICommandHost;
    buttonToolbarButtons: ButtonToolbarType[];

    constructor(cmdHost: ICommandHost, buttonToolbarButtons: ButtonToolbarType[]) {
        this.cmdHost = cmdHost;
        this.buttonToolbarButtons = buttonToolbarButtons;
        this.container = HFlex(null, "gap-1");

        for (let toolbarButton of buttonToolbarButtons) {
            if (isButtonToolbarButton(toolbarButton)) {
                const button = Button();
                button.classList.add("whitespace-nowrap");

                const cmd = cmdHost.getCommand(toolbarButton.action);

                if (cmd) {
                    if (cmd.icon) {
                        const iconSpan = document.createElement("span");
                        iconSpan.className = cmd.icon;
                        button.appendChild(iconSpan);
                    }

                    const hotkey = cmdHost.getHotkeyForCommand(toolbarButton.action);

                    if (cmd.description) {
                        button.title = cmd.description;
                        if (hotkey) {
                            button.title += " (" + hotkey + ")";
                        }
                    } else
                    if (hotkey) {
                        button.title = hotkey;
                    }
                }

                const t = document.createTextNode(toolbarButton.label)
                button.appendChild(t);

                button.addEventListener("mousedown", e => e.preventDefault() ); // prevent taking focus
                button.addEventListener("click", () => cmdHost.executeCommand(toolbarButton.action));

                this.container.appendChild(button);
            } else {
                const spacer = document.createElement("div");
                spacer.className = "w-0";
                this.container.appendChild(spacer);
            }
        }
    }

    setCommandEnabled(command: string, enabled: boolean) {
        const index = this.buttonToolbarButtons.findIndex(b => b.type === "button" && b.action === command);
        if (index === -1) {
            return;
        }

        const button = this.container.childNodes[index] as HTMLButtonElement;
        button.disabled = !enabled;
    }

    getDomNode(): Node {
        return this.container;
    }
}
