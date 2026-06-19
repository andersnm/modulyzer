import { CommandMenuItem } from "../menu/menu";
import { IComponent } from "./IComponent";
import { MnemonicLabel, parseMnemonic } from "./StandardStuff";
import { ICommand } from "./ICommand";
import { MenuBar } from "./Menubar";

export class MenubarItem implements IComponent, ICommand {
    itemNode: HTMLElement;

    constructor(private menubar: MenuBar, public item: CommandMenuItem, public itemIndex: number) {
        this.itemNode = document.createElement("div");
        this.menubar.bindMenubarItemStyle(this.itemNode, itemIndex);

        this.itemNode.tabIndex = 0;
        this.itemNode.addEventListener("focusin", this.onMenubarItemFocus);
        this.itemNode.addEventListener("mousedown", this.onMenubarItemMousedown);
        this.itemNode.addEventListener("mouseenter", this.onMenubarItemMouseEnter);
        this.itemNode.addEventListener("mouseleave", this.onMenubarItemMouseLeave);
        this.itemNode.addEventListener("keydown", this.onMenubarItemKeydown);

        const labelParts = parseMnemonic(item.label);
        this.itemNode.appendChild(MnemonicLabel(labelParts));

        this.menubar.app.registerCommand("focus-menubar-" + item.label, null, null, this);

        const mnemonicPart = labelParts.find(m => "mnemonic" in m);
        const focusHotkey = "ALT+" + mnemonicPart?.mnemonic.charAt(0).toUpperCase();
        if (focusHotkey) {
            this.menubar.app.registerHotkey(focusHotkey, "focus-menubar-" + item.label);
        }
    }

    onMenubarItemFocus = (ev: FocusEvent) => {
        this.menubar.setSelectedIndex(this.itemIndex);
    };

    onMenubarItemMousedown = (ev: PointerEvent) => {
        ev.preventDefault();

        const el = ev.currentTarget as HTMLElement;

        if (this.menubar.menu.visible) {
            this.menubar.setSelectedIndex(-1);
            // click on menu bar item closes and returns focus, but leaves hover
            this.menubar.focusElement?.focus();
            this.menubar.focusElement = null;
            ev.preventDefault();
            return;
        }

        if (!this.menubar.focusElement) {
            this.menubar.focusElement = document.activeElement as HTMLElement;
        }

        this.menubar.setSelectedIndex(this.itemIndex);
        this.menubar.showMenubar();
    };

    onMenubarItemMouseEnter = (ev: PointerEvent) => {
        const el = ev.currentTarget as HTMLElement;
        this.menubar.setSelectedIndex(this.itemIndex);
    };

    onMenubarItemMouseLeave = (ev: PointerEvent) => {
        if (this.menubar.menu.visible) {
            return;
        }

        this.menubar.setSelectedIndex(-1);
    };

    onMenubarItemKeydown = (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            this.menubar.showMenubar();
        } else if (ev.key === "Escape") {
            ev.preventDefault();
            console.log("escape from menubar", this.menubar.focusElement);
            this.menubar.setSelectedIndex(-1);
            this.menubar.focusElement?.focus();
            this.menubar.focusElement = null;
        } else if (ev.key === "ArrowRight") {
            ev.preventDefault();
            this.menubar.setSelectedIndex((this.menubar.selectedIndex + 1) % this.menubar.menuItems.length);
            if (!this.menubar.menu.visible){
                const el = this.menubar.menuContainer.childNodes[this.menubar.selectedIndex] as HTMLElement;
                el.focus();
            }
        } else if (ev.key === "ArrowLeft") {
            ev.preventDefault();
            this.menubar.setSelectedIndex((this.menubar.selectedIndex + this.menubar.menuItems.length - 1) % this.menubar.menuItems.length);
            if (!this.menubar.menu.visible){
                const el = this.menubar.menuContainer.childNodes[this.menubar.selectedIndex] as HTMLElement;
                el.focus();
            }
        }
    };

    handle() {
        this.menubar.focusElement = document.activeElement as HTMLElement;
        this.menubar.setSelectedIndex(this.itemIndex);
        this.menubar.showMenubar();
    }

    getDomNode(): Node {
        return this.itemNode;
    }
}
