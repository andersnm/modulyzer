import { ICommandHost } from "./CommandHost";
import { IComponent, INotify } from "./IComponent";
import { Menu, MenuItem } from "./Menu";
import { convertNutzMenu } from "./Menubar";

export class ContextMenuContainer implements INotify {
    menu: Menu;
    overlay: HTMLDivElement;
    commandHost: ICommandHost;

    constructor() {
        this.menu = new Menu(this);
    }

    show(app: ICommandHost, x: number, y: number, menu: MenuItem[]) {

        this.overlay = document.createElement("div");
        this.overlay.className = "relative z-10";

        const dialogOuterNode = document.createElement("div");
        dialogOuterNode.className = "fixed inset-0 z-10 w-screen overflow-y-auto";
        dialogOuterNode.addEventListener("pointerdown", () => {
            this.hide();
        });

        this.overlay.appendChild(dialogOuterNode);
        document.body.appendChild(this.overlay);

        const nutzMenu = convertNutzMenu(app, menu)

        this.commandHost = app;
        this.menu.bindMenu(nutzMenu);
        this.menu.setPosition(x, y);
        this.menu.show();
    }

    hide() {
        document.body.removeChild(this.overlay);
        this.overlay = null;
        this.commandHost = null;
        this.menu.hide();
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (eventName === "action") {
            const commandHost = this.commandHost;
            this.hide();
            commandHost.executeCommand(args[0]);
        } else if (eventName === "keydown") {
            if (args[0].key === "Escape") {
                this.hide();
            }
        }
    }
}