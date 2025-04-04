import { IComponent } from "./IComponent";

export interface MenuItem {
    label: string;
    action?: string;
    icon?: string;
    shortcut?: string; //
    items?: MenuItem[]; 
}

export class Menu implements IComponent {
    private parent: IComponent;
    menuContainer: HTMLElement;
    inner: HTMLElement;
    submenu: Menu = null;
    submenuItemIndex: number = -1;
    selectedIndex: number = -1;
    items: MenuItem[] = [];

    constructor(parent: IComponent) {
        this.parent = parent;
        this.menuContainer = document.createElement("div");
        this.menuContainer.tabIndex = 0;
        this.menuContainer.className = "nutz-menu absolute px-1 py-1 bg-neutral-600 rounded w-72";

        this.inner = document.createElement("div");
        this.inner.className = "flex flex-col p-1 bg-neutral-800 rounded-lg overflow-auto text-white";

        this.menuContainer.appendChild(this.inner);

        this.menuContainer.addEventListener("keydown", ev => {
            // console.log("mkdown", this, ev)
            // right -> open flyout if exist, or menubar next (from flyout too)
            const oldIndex = this.selectedIndex;

            if (ev.key === "ArrowDown") {
                if (this.selectedIndex < this.items.length - 1) {
                    this.selectedIndex++;
                } else {
                    this.selectedIndex = 0;
                }
            } else if (ev.key === "ArrowUp") {
                if (this.selectedIndex > 0) {
                    this.selectedIndex--; 
                } else {
                    this.selectedIndex = this.items.length - 1;
                }
            } else if (ev.key === "ArrowLeft") {
                this.parent.notify(this, "keydown", ev);
            } else if (ev.key === "ArrowRight") {
                const item = this.items[this.selectedIndex];
                if (item && item.items && item.items.length) {
                    const itemOuterNode = this.inner.childNodes[this.selectedIndex] as HTMLElement;
                    const rc = itemOuterNode.getBoundingClientRect()

                    this.submenu = new Menu(this);
                    this.submenu.bindMenu(item.items);
                    this.submenu.setPosition(rc.right, rc.top);
                    this.submenu.show();

                    this.submenuItemIndex = this.selectedIndex;
                    // this.submenuNode = itemOuterNode;
                } else {
                   this.parent.notify(this, "keydown", ev);
                }
            } else if (ev.key === "Enter") {
                const item = this.items[this.selectedIndex];
                this.notify(this, "action", item.action);
            }

            // const selectedItem = this.items[this.selectedIndex];

            if (oldIndex !== this.selectedIndex) {
                if (oldIndex !== -1) {
                    const oldNode = this.inner.childNodes[oldIndex] as HTMLElement;
                    this.bindMenuItemStyle(oldNode, oldIndex);
                }

                const selectedNode = this.inner.childNodes[this.selectedIndex] as HTMLElement;
                this.bindMenuItemStyle(selectedNode, this.selectedIndex);
            }
        });
    }

    show() {
        document.body.appendChild(this.menuContainer);
        this.menuContainer.focus();
    }

    hide() {
        this.closeSubmenu();

        if (this.menuContainer.parentNode) {
            document.body.removeChild(this.menuContainer);
        }
    }

    closeSubmenu() {
        if (this.submenu) {
            this.submenu.hide();
            this.submenu = null;

            this.submenuItemIndex = -1;
        }
    }

    setPosition(x, y) {
        this.menuContainer.style.left = x + "px";
        this.menuContainer.style.top = y + "px";
    }

    bindMenuItemStyle(itemOuterNode: HTMLElement, itemIndex: number) {
        const open = this.selectedIndex == itemIndex || this.submenuItemIndex == itemIndex; // === item; // !!item.open; // if the flyout; hover
        itemOuterNode.className = "flex flex-row " + (open ? "bg-neutral-200 text-neutral-700" : "");
    }

    bindMenuItem(itemOuterNode: HTMLElement, itemIndex: number) {
        const item = this.items[itemIndex];

        while (itemOuterNode.childNodes.length > 0) itemOuterNode.removeChild(itemOuterNode.lastChild);

        this.bindMenuItemStyle(itemOuterNode, itemIndex);

        const iconNode = document.createElement("div");
        iconNode.className = "w-6";

        const iconSpan = document.createElement("span");
        iconSpan.className = "hgi-stroke " + item.icon;

        iconNode.appendChild(iconSpan);

        const labelNode = document.createElement("div");
        labelNode.className = "flex-1";
        labelNode.innerText = item.label;

        const hotkeyNode = document.createElement("div");
        hotkeyNode.className = "flex-0";

        if (item.shortcut) {
            hotkeyNode.innerText = item.shortcut;
        }

        const arrowNode = document.createElement("div");
        arrowNode.className = "w-6 text-right";
        arrowNode.innerText = (item.items && item.items.length) ? ">" : "";

        itemOuterNode.appendChild(iconNode);
        itemOuterNode.appendChild(labelNode);
        itemOuterNode.appendChild(hotkeyNode);
        itemOuterNode.appendChild(arrowNode);
    }

    bindMenu(menu: MenuItem[]) {

        this.items = menu;

        while (this.inner.childNodes.length > 0) this.inner.removeChild(this.inner.lastChild);

        for (let itemIndex = 0; itemIndex < this.items.length; itemIndex++) {
            const item = this.items[itemIndex];
            const itemOuterNode = document.createElement("div");

            itemOuterNode.addEventListener("mouseover", ev => {
                // if openable
                if (this.submenu) {
                    this.submenu.hide();
                    this.submenu = null;

                    const i = this.submenuItemIndex;
                    const n = this.inner.childNodes[i] as HTMLElement; // submenuNode;
                    // const n = this.submenuNode;
                    this.submenuItemIndex = -1;
                    // this.submenuNode = null;

                    // rebind whichever item was open as closed
                    this.bindMenuItemStyle(n, i);

                }

                // focus self
                this.menuContainer.focus();

                // hover change selectedIndex
                const i = this.selectedIndex;

                this.selectedIndex = itemIndex;

                if (i !== -1 && i != itemIndex) {
                    // redraw previous selection witout selection
                    const n = this.inner.childNodes[i] as HTMLElement;
                    this.bindMenuItemStyle(n, i)
                }

                // this.bindMenuItem(n, i)

                if (item.items?.length) {
                    const el = ev.target as Element;
                    const rc = itemOuterNode.getBoundingClientRect()
                    // this.showMenu(rc.left, rc.bottom, item.items);

                    this.submenu = new Menu(this);
                    this.submenu.bindMenu(item.items);
                    this.submenu.setPosition(rc.right, rc.top);
                    this.submenu.show();

                    this.submenuItemIndex = itemIndex;
                    // this.submenuNode = itemOuterNode;

                    // rebind this item with permanent open 
                    this.bindMenuItemStyle(itemOuterNode, itemIndex);
                } else {
                    this.bindMenuItemStyle(itemOuterNode, itemIndex);
                }
            });

            itemOuterNode.addEventListener("click", () => {
                // this.app.executeCommand(item.action);
                this.notify(this, "action", item.action);
            });

            this.bindMenuItem(itemOuterNode, itemIndex);
            this.inner.appendChild(itemOuterNode);
        }
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        
        if (eventName === "action") {
            this.hide();
            this.parent.notify(source, eventName, ...args);
        } else if (eventName === "keydown") {
            if (args[0].key === "ArrowLeft") {
                // child menu 
                this.closeSubmenu();
                this.menuContainer.focus();
            } else if (args[0].key === "ArrowRight") {
                // if item has child items, open it, else send to parent
            }
        }
    }

    getDomNode(): Node {
        return null;
    }
};
