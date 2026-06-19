import { CommandMenuItem } from "../menu/menu";
import { MenuItem } from "./Menu";
import { CommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { Menu } from "./Menu";
import { isFocusable } from "./DomUtil";
import { MnemonicLabel, parseMnemonic } from "./StandardStuff";
import { ICommand } from "./ICommand";
import { MenubarItem } from "./MenubarItem";

export function convertNutzMenu(app: CommandHost, menu: CommandMenuItem[]): MenuItem[] {
    const nutzMenu: MenuItem[] = menu.map(m => ({
        label: m.label,
        action: m.action,
        icon: app.getCommand(m.action)?.icon,
        shortcut: app.getHotkeyForCommand(m.action),
        checked: m.checked,
        items: m.items ? convertNutzMenu(app, m.items) : null,
        disabled: !app.getCommandState(m.action).enabled,
    }));

    return nutzMenu;
}

export class MenuBar implements IComponent {
    app: CommandHost;
    menuContainer: HTMLElement;
    menu: Menu;
    selectedIndex: number = -1;
    menuItems: CommandMenuItem[] = null;
    focusElement: HTMLElement = null;

    constructor(app: CommandHost) {
        this.app = app;
        this.menuContainer = document.createElement("div");
        this.menuContainer.className = "flex flex-row nutz-menubar";
        this.menu = new Menu();
        this.menu.addEventListener("action", this.onMenuAction);
        this.menu.addEventListener("keydown", this.onMenuKeyDown);

        window.addEventListener("pointerdown", this.onGlobalPointerDown, true);
    }

    onMenuAction = (ev: CustomEvent) => {
        this.menu.hide();
        this.focusElement?.focus();
        this.focusElement = null;

        this.app.executeCommand(ev.detail);
    };

    onMenuKeyDown = (ev: CustomEvent<KeyboardEvent>) => {
        // Submenu is open and focused. Menubar receives keypresses not handled by the submenu.
        const keyEv = ev.detail;

        if (keyEv.key === "ArrowRight") {
            this.setSelectedIndex((this.selectedIndex + 1) % this.menuItems.length);
            const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
            el.focus();
        } else if (keyEv.key === "ArrowLeft") {
            this.setSelectedIndex((this.selectedIndex + this.menuItems.length - 1) % this.menuItems.length);
            const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
            el.focus();
        } else if (keyEv.key === "Escape") {
            console.log("escape from menu")
            this.menu.hide();
            // menubar remains focused, use arrows to navigate or enter to open menu again
            const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
            el.focus();
        }
    };

    onGlobalPointerDown = (ev: PointerEvent) => {
        // only when focus is inside menubar or open menucontainer and click is outside
        // if target element is focusable, focus that, otherwise, focusElement

        let testMenu = this.menu;
        let hasFocus = this.menuContainer.contains(document.activeElement);
        let hasClickInside = this.menuContainer.contains(ev.target as Node);
        while (testMenu) {
            hasFocus = hasFocus || testMenu.menuContainer.contains(document.activeElement);
            hasClickInside = hasClickInside || testMenu.menuContainer.contains(ev.target as Node);
            testMenu = testMenu.submenu;
        }

        if (hasFocus && !hasClickInside) {
            this.setSelectedIndex(-1);
            this.menu.hide();

            if (isFocusable(ev.target as HTMLElement)) {
                this.focusElement = null;
            } else {
                this.focusElement?.focus();
                this.focusElement = null;
                ev.preventDefault();
            }
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

        if (this.menu.visible) {
            this.menu.hide();
            if (this.selectedIndex >= 0) {
                this.showMenubar();
            }
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

        for (let itemIndex = 0; itemIndex < menu.length; itemIndex++) {
            const item = menu[itemIndex];
            const menubarItem = new MenubarItem(this, item, itemIndex);
            const itemNode = menubarItem.getDomNode() as HTMLElement;
            this.menuContainer.appendChild(itemNode);

        }
    }

    showMenubar() {
        const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;

        const item = this.menuItems[this.selectedIndex];
        const rc = el.getBoundingClientRect()
        this.showMenu(rc.left, rc.bottom, item.items);
        this.bindMenubarItemStyle(el, this.selectedIndex);
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
