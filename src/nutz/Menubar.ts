import { MenuItem } from "../menu/menu";
import { MenuItem as NutzMenuItem } from "./Menu";
import { ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { Menu } from "./Menu";

export function convertNutzMenu(app: ICommandHost, menu: MenuItem[]): NutzMenuItem[] {
    const nutzMenu: NutzMenuItem[] = menu.map(m => ({
        label: m.label,
        action: m.action,
        icon: app.getCommand(m.action)?.icon,
        shortcut: app.getHotkeyForCommand(m.action),
        checked: m.checked,
        items: m.items ? convertNutzMenu(app, m.items) : null,
    }));

    return nutzMenu;
}

export class MenuBar implements IComponent {
    app: ICommandHost;
    menuContainer: HTMLElement;
    menu: Menu;
    selectedIndex: number = -1;
    open: boolean = false;
    hovering: boolean = false;
    menuItems: MenuItem[] = null;

    constructor(app: ICommandHost) {
        this.app = app;
        this.menuContainer = document.createElement("div");
        this.menuContainer.className = "flex flex-row nutz-menubar";
        this.menu = new Menu();
        this.menu.addEventListener("action", this.onMenuAction);
        this.menu.addEventListener("keydown", this.onMenuKeyDown);
    }

    onMenuAction = (ev: CustomEvent) => {
        const oldNode = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
        const oldIndex = this.selectedIndex;

        if (!this.hovering) {
            this.selectedIndex = -1; // unless hover - grr
        }

        this.bindMenubarItemStyle(oldNode, oldIndex);

        this.menu.hide();

        this.app.executeCommand(ev.detail);
    };

    onMenuKeyDown = (ev: CustomEvent) => {
        const keyEv = ev.detail;

        const oldNode = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
        const oldIndex = this.selectedIndex;

        if (keyEv.key === "ArrowRight") {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
        } else if (keyEv.key === "ArrowLeft") {
            this.selectedIndex = (this.selectedIndex + this.menuItems.length - 1) % this.menuItems.length;
        }

        this.bindMenubarItemStyle(oldNode, oldIndex);

        this.menu.hide();

        const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;

        const item = this.menuItems[this.selectedIndex];
        const rc = el.getBoundingClientRect()
        this.showMenu(rc.left, rc.bottom, item.items);

        this.bindMenubarItemStyle(el, this.selectedIndex);
    };

    bindMenubarItemStyle(itemNode: HTMLElement, index: number) {
        // const itemNode = this.menuContainer.childNodes[index] as HTMLElement;

        // console.log("BINDITEM", itemNode, index)
        const hover = index == this.selectedIndex;

        itemNode.className = "px-1 rounded " + (hover ? "bg-neutral-700 text-neutral-100" : "bg-neutral-800 text-neutral-300"); // hover:bg-neutral-700 hover:text-neutral-100";
        // itemNode.className = "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 px-1 rounded";
    }

    bindMenubarMenu(menu: MenuItem[]) {

        this.menuItems = menu;
        while (this.menuContainer.childNodes.length > 0) this.menuContainer.removeChild(this.menuContainer.lastChild);

        // click -> open menu, begin hover, clickthrough, close on (non-menu/any) action

        // let open = false;

        for (let itemIndex = 0; itemIndex < menu.length; itemIndex++) {
        // for (let item of menu) {
            const item = menu[itemIndex];
            const itemNode = document.createElement("div");
            this.bindMenubarItemStyle(itemNode, itemIndex);
            // itemNode.className = "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 px-1 rounded";

            itemNode.tabIndex = 0;
            itemNode.addEventListener("click", (ev: PointerEvent) => {
                // "open" menubar -> show menu, enable hovering
                // add it to the body root?? 
                // "app.showMenu()"?? need action target
                console.log("CLICK")
                if (this.open) {
                    this.menu.hide();
                    this.open = false;
                    return;
                }

                const el = ev.target as Element;
                const rc = el.getBoundingClientRect()
                this.showMenu(rc.left, rc.bottom, item.items);

                this.selectedIndex = itemIndex;

                this.open = true;
            });

            itemNode.addEventListener("mouseleave", (ev) => {
                const oldIndex = this.selectedIndex;
                const oldNode = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;

                this.hovering = false;
                if (this.open) {
                    return;
                }

                this.selectedIndex = -1;
                if (oldNode) {
                    this.bindMenubarItemStyle(oldNode, oldIndex);
                }

            });

            itemNode.addEventListener("mouseenter", (ev) => {

                // const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
                this.hovering = true;

                // this.bindMenubarItemStyle()
                const oldIndex = this.selectedIndex;
                const oldNode = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;

                const el = ev.target as HTMLElement;
                this.selectedIndex  = Array.prototype.indexOf.call(this.menuContainer.childNodes, el); ;
                if (oldNode) {
                    this.bindMenubarItemStyle(oldNode, oldIndex);
                }

                this.bindMenubarItemStyle(el, this.selectedIndex);

                if (!this.open) {
                    return;
                }

                const rc = el.getBoundingClientRect()
                this.showMenu(rc.left, rc.bottom, item.items);
            });

            itemNode.appendChild(document.createTextNode(item.label));
            this.menuContainer.appendChild(itemNode);
        }
    }

    showMenu(x: number, y: number, menu: MenuItem[]) {
        // translate to menu component's menuitem with shortcut, icon etc from the command
        const nutzMenu = convertNutzMenu(this.app, menu)
        this.menu.bindMenu(nutzMenu);
        this.menu.show(x, y);
    }

    getDomNode(): Node {
        return this.menuContainer;
    }
}
