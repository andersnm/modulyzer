import { MenuItem } from "../menu/menu";
import { ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { Menu, MenuItem as NutzMenuItem } from "./Menu";
import { convertNutzMenu } from "./Menubar";

export class ContextMenuContainer {
    menu: Menu;
    overlay: HTMLDivElement;
    commandHost: ICommandHost;
    focusElement: HTMLElement;
    resolve: (item: any) => void;

    constructor() {
        this.menu = new Menu();
        this.menu.addEventListener("action", this.onMenuAction);
        this.menu.addEventListener("keydown", this.onMenuKeyDown);
    }

    async show(app: ICommandHost, x: number, y: number, menu: MenuItem[]) {
        const nutzMenu = convertNutzMenu(app, menu)

        this.commandHost = app;

        const action = await this.showPopup(x, y, nutzMenu);
        if (!action) {
            return null;
        }

        return await app.executeCommand(action);
    }

    // Returns the action property of the selected menu item, or null if canceled
    async showPopup(x: number, y: number, menu: NutzMenuItem[]): Promise<string | null> {

        if (this.resolve) {
            this.resolve(null);
            this.resolve = null;
        }

        return new Promise<any>((resolve, reject) => {

            this.resolve = resolve;
            this.focusElement = document.activeElement as HTMLElement;

            this.overlay = document.createElement("div");
            this.overlay.className = "relative z-10";

            const dialogOuterNode = document.createElement("div");
            dialogOuterNode.className = "fixed inset-0 z-10 w-screen overflow-y-auto";
            dialogOuterNode.addEventListener("pointerup", this.onOverlayPointerDown);

            this.overlay.appendChild(dialogOuterNode);
            document.body.appendChild(this.overlay);

            this.menu.bindMenu(menu);
            this.menu.show(x, y);
        });
    }

    onOverlayPointerDown = (ev: PointerEvent) => {
        this.hide();
        this.resolve(null);
        this.resolve = null;

        // const targetElement = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement;
        // if (targetElement) {
        //     const newEvent = new MouseEvent("click", { bubbles: true, cancelable: true, clientX: ev.clientX, clientY: ev.clientY });
        //     targetElement.dispatchEvent(newEvent);
        // }

        ev.stopPropagation(); // dont run global handler
        ev.preventDefault();
    };

    hide() {
        document.body.removeChild(this.overlay);
        this.overlay = null;
        this.commandHost = null;
        this.menu.hide();
        this.focusElement?.focus();
    }

    onMenuAction = (ev: CustomEvent) => {
        const commandHost = this.commandHost;
        this.hide();
        this.resolve(ev.detail);
        this.resolve = null;
    };

    onMenuKeyDown = (ev: CustomEvent) => {
        if (ev.detail.key === "Escape") {
            this.hide();
            this.resolve(null);
            this.resolve = null;
        }
    };
}