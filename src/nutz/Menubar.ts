import { CommandMenuItem } from "../menu/menu";
import { MenuItem } from "./Menu";
import { ICommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { Menu } from "./Menu";

export function convertNutzMenu(app: ICommandHost, menu: CommandMenuItem[]): MenuItem[] {
    const nutzMenu: MenuItem[] = menu.map(m => ({
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
    menuItems: CommandMenuItem[] = null;

    constructor(app: ICommandHost) {
        this.app = app;
        this.menuContainer = document.createElement("div");
        this.menuContainer.className = "flex flex-row nutz-menubar";
        this.menu = new Menu();
        this.menu.addEventListener("action", this.onMenuAction);
        this.menu.addEventListener("keydown", this.onMenuKeyDown);
    }

    onMenuAction = (ev: CustomEvent) => {
        if (!this.hovering) {
            this.setSelectedIndex(-1);
        }

        this.menu.hide();
        this.open = false;
        window.removeEventListener("pointerdown", this.onGlobalPointerDown, true);

        this.app.executeCommand(ev.detail);
    };

    onMenuKeyDown = (ev: CustomEvent<KeyboardEvent>) => {
        const keyEv = ev.detail;

        if (keyEv.key === "ArrowRight") {
            this.setSelectedIndex((this.selectedIndex + 1) % this.menuItems.length);
        } else if (keyEv.key === "ArrowLeft") {
            this.setSelectedIndex((this.selectedIndex + this.menuItems.length - 1) % this.menuItems.length);
        }

        this.menu.hide();

        const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;

        const item = this.menuItems[this.selectedIndex];
        const rc = el.getBoundingClientRect()
        this.showMenu(rc.left, rc.bottom, item.items);

        this.bindMenubarItemStyle(el, this.selectedIndex);
    };

    onGlobalPointerDown = (ev: PointerEvent) => {
        if (
            !this.menu.containsNode(ev.target as Node) &&
            !this.menuContainer.contains(ev.target as Node)
        ) {
            this.setSelectedIndex(-1);
            this.menu.hide();
            this.open = false;
            window.removeEventListener("pointerdown", this.onGlobalPointerDown, true);
        }
    };

    setSelectedIndex(index: number) {
        const oldNode = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
        const oldIndex = this.selectedIndex;

        this.selectedIndex = index;
        if (oldNode) {
            this.bindMenubarItemStyle(oldNode, oldIndex);
        }

        const newNode = this.menuContainer.childNodes[index] as HTMLElement;
        if (newNode) {
            this.bindMenubarItemStyle(newNode, index);
        }
    }

    bindMenubarItemStyle(itemNode: HTMLElement, index: number) {
        const hover = index == this.selectedIndex;
        itemNode.className = "px-1 rounded " + (hover ? "bg-neutral-700 text-neutral-100" : "bg-neutral-800 text-neutral-300"); // hover:bg-neutral-700 hover:text-neutral-100";
    }

    bindMenubarMenu(menu: CommandMenuItem[]) {

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
                    window.removeEventListener("pointerdown", this.onGlobalPointerDown, true);
                    return;
                }

                const el = ev.target as Element;
                const rc = el.getBoundingClientRect()
                this.showMenu(rc.left, rc.bottom, item.items);

                this.selectedIndex = itemIndex;

                this.open = true;
                window.addEventListener("pointerdown", this.onGlobalPointerDown, true);
            });

            itemNode.addEventListener("mouseleave", (ev) => {
                this.hovering = false;
                if (this.open) {
                    return;
                }

                this.setSelectedIndex(-1);
            });

            itemNode.addEventListener("mouseenter", (ev) => {

                this.hovering = true;

                const el = ev.target as HTMLElement;
                const index = Array.prototype.indexOf.call(this.menuContainer.childNodes, el);
                this.setSelectedIndex(index);

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

    showMenu(x: number, y: number, menu: CommandMenuItem[]) {
        // translate to menu component's menuitem with shortcut, icon etc from the command
        const nutzMenu = convertNutzMenu(this.app, menu)
        this.menu.bindMenu(nutzMenu);
        this.menu.show(x, y);
    }

    getDomNode(): Node {
        return this.menuContainer;
    }
}
