import { CommandMenuItem } from "../menu/menu";
import { MenuItem } from "./Menu";
import { CommandHost } from "./CommandHost";
import { IComponent } from "./IComponent";
import { Menu } from "./Menu";

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

type MnemonicPart = { text: string } | { mnemonic: string };

function parseMnemonic(label: string) {
    let text = "";

    const parts: MnemonicPart[] = [];
    for (let i = 0; i < label.length; i++) {
        const c = label[i];

        if (c === "&") {
            const next = label[i + 1];

            if (next === "&") {
                text += "&";
                i++;
            } else {
                const mnemonic = next;
                if (text.length > 0) {
                    parts.push({ text });
                    text = "";
                }
                parts.push({ mnemonic });
                text = "";
                i++;
            }
        } else {
            text += c;
        }
    }

    if (text.length > 0) {
        parts.push({ text });
    }

    return parts;
}

function MnemonicLabel(parts: MnemonicPart[]) {
    const container = document.createElement("span");

    for (let part of parts) {
        if ("text" in part) {
            container.appendChild(document.createTextNode(part.text));
        } else if ("mnemonic" in part) {
            const el = document.createElement("span");
            el.className = "underline";
            el.appendChild(document.createTextNode(part.mnemonic));
            container.appendChild(el);
        }
    }

    return container;
}

function isFocusable(el: HTMLElement): boolean {
    if (!el.isConnected) return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;

    if ((el as any).disabled) return false;

    const tabindex = el.getAttribute("tabindex");
    if (tabindex !== null && !isNaN(parseInt(tabindex))) {
        return true;
    }

    const focusableTags = ["A", "INPUT", "BUTTON", "SELECT", "TEXTAREA"];
    if (focusableTags.includes(el.tagName)) {
        if (el.tagName === "A") {
            return (el as HTMLAnchorElement).href !== "";
        }
        return true;
    }

    if (el.hasAttribute("contenteditable")) return true;

    return false;
}

export class MenuBar implements IComponent {
    app: CommandHost;
    menuContainer: HTMLElement;
    menu: Menu;
    selectedIndex: number = -1;
    open: boolean = false;
    hovering: boolean = false;
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
        if (!this.hovering) {
            this.setSelectedIndex(-1);
        }

        this.menu.hide();
        this.open = false;
        this.focusElement?.focus();
        this.focusElement = null;

        this.app.executeCommand(ev.detail);
    };

    onMenuKeyDown = (ev: CustomEvent<KeyboardEvent>) => {
        const keyEv = ev.detail;

        if (keyEv.key === "ArrowRight") {
            this.setSelectedIndex((this.selectedIndex + 1) % this.menuItems.length);
        } else if (keyEv.key === "ArrowLeft") {
            this.setSelectedIndex((this.selectedIndex + this.menuItems.length - 1) % this.menuItems.length);
        } else if (keyEv.key === "Escape") {
            console.log("escape from menu")
            this.open = false;
            this.menu.hide();
            // menubar remains focused, use arrows to navigate or enter to open menu again
        }

        if (this.open) {
            this.menu.hide();
            this.showMenubar();
        } else {
            const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
            el.focus();
        }
    };

    onGlobalPointerDown = (ev: PointerEvent) => {
        // only when focus is inside menubar or open menucontainer and click is outside
        // if target element is focusable, focus that, otherwise, focusElement

        const hasFocus = this.menuContainer.contains(document.activeElement) || this.menu.menuContainer.contains(document.activeElement);
        const hasClickInside = this.menu.containsNode(ev.target as Node) || this.menuContainer.contains(ev.target as Node);

        if (hasFocus && !hasClickInside) {
            this.setSelectedIndex(-1);
            this.menu.hide();
            this.open = false;

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
            const itemNode = document.createElement("div");
            this.bindMenubarItemStyle(itemNode, itemIndex);

            itemNode.tabIndex = 0;

            itemNode.addEventListener("focusin", (ev) => {
                this.setSelectedIndex(itemIndex);
                if (this.open) {
                    this.menu.hide();
                    this.showMenubar();
                }

            });

            itemNode.addEventListener("mousedown", (ev: PointerEvent) => {
                if (this.open) {
                    this.menu.hide();
                    this.open = false;
                    // click on menu bar item closes and returns focus, but leaves hover
                    this.focusElement?.focus();
                    this.focusElement = null;
                    ev.preventDefault();
                    return;
                }

                if (!this.focusElement) {
                    this.focusElement = document.activeElement as HTMLElement;
                }
                this.selectedIndex = itemIndex;

                this.showMenubar();

                this.open = true;
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

                this.menu.hide();
                this.showMenubar();
            });

            itemNode.addEventListener("keydown", (ev: KeyboardEvent) => {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    this.open = true;
                    this.showMenubar();
                } else if (ev.key === "Escape") {
                    ev.preventDefault();
                    console.log("escape from menubar", this.focusElement);
                    this.menu.hide();
                    this.focusElement?.focus();
                    this.focusElement = null;
                    this.open = false;
                    this.setSelectedIndex(-1);
                } else if (ev.key === "ArrowRight") {
                    ev.preventDefault();
                    this.setSelectedIndex((this.selectedIndex + 1) % this.menuItems.length);
                    if (this.open) {
                        this.menu.hide();
                        this.showMenubar();
                    } else {
                        const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
                        el.focus();
                    }
                } else if (ev.key === "ArrowLeft") {
                    ev.preventDefault();
                    this.setSelectedIndex((this.selectedIndex + this.menuItems.length - 1) % this.menuItems.length);
                    if (this.open) {
                        this.menu.hide();
                        this.showMenubar();
                    } else {
                        const el = this.menuContainer.childNodes[this.selectedIndex] as HTMLElement;
                        el.focus();
                    }
                }
            });

            const labelParts = parseMnemonic(item.label);
            itemNode.appendChild(MnemonicLabel(labelParts));
            this.menuContainer.appendChild(itemNode);

            this.app.registerCommand("focus-menubar-" + item.label, null, null, {
                handle: () => {
                    console.log("hey, surprise!")
                    this.focusElement = document.activeElement as HTMLElement;
                    this.open = true;
                    this.setSelectedIndex(itemIndex);
                    this.showMenubar();
                }
            });

            const mnemonicPart = labelParts.find(m => "mnemonic" in m);
            const focusHotkey = "ALT+" + mnemonicPart?.mnemonic.charAt(0).toUpperCase();
            if (focusHotkey) {
                this.app.registerHotkey(focusHotkey, "focus-menubar-" + item.label);
            }
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
