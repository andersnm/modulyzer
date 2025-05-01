import { MenuItem } from "../menu/menu";
import { ICommandHost } from "./CommandHost";
import { IComponent, INotify } from "./IComponent";
import { Menu, MenuItem as NutzMenuItem } from "./Menu";
import { convertNutzMenu } from "./Menubar";

export class ContextMenuContainer implements INotify {
    menu: Menu;
    overlay: HTMLDivElement;
    commandHost: ICommandHost;
    focusElement: HTMLElement;
    resolve: (item: NutzMenuItem) => void;

    constructor() {
        this.menu = new Menu(this);
    }

    async show(app: ICommandHost, x: number, y: number, menu: MenuItem[]) {
        const nutzMenu = convertNutzMenu(app, menu)

        this.commandHost = app;

        const result = await this.showPopup(x, y, nutzMenu);
        if (!result) {
            return null;
        }

        return await app.executeCommand(result.action);
    }

    async showPopup(x: number, y: number, menu: NutzMenuItem[]) {

        if (this.resolve) {
            this.resolve(null);
            this.resolve = null;
        }

        return new Promise<NutzMenuItem>((resolve, reject) => {

            this.resolve = resolve;
            this.focusElement = document.activeElement as HTMLElement;

            this.overlay = document.createElement("div");
            this.overlay.className = "relative z-10";

            const dialogOuterNode = document.createElement("div");
            dialogOuterNode.className = "fixed inset-0 z-10 w-screen overflow-y-auto";
            dialogOuterNode.addEventListener("pointerdown", this.onOverlayPointerDown);

            this.overlay.appendChild(dialogOuterNode);
            document.body.appendChild(this.overlay);

            this.menu.bindMenu(menu);
            this.menu.show(x, y);
        });
    }

    onOverlayPointerDown = () => {
        this.hide();
        this.resolve(null);
        this.resolve = null;
    };

    hide() {
        document.body.removeChild(this.overlay);
        this.overlay = null;
        this.commandHost = null;
        this.menu.hide();
        this.focusElement?.focus();
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (eventName === "action") {
            const commandHost = this.commandHost;
            this.hide();
            this.resolve(args[0]);
            this.resolve = null;
        } else if (eventName === "keydown") {
            if (args[0].key === "Escape") {
                this.hide();
                this.resolve(null);
                this.resolve = null;
            }
        }
    }
}