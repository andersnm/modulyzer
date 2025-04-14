import { ICommandHost } from "./CommandHost";
import { domAppendNodes } from "./DomUtil";
import { IComponent, INotify } from "./IComponent";

export function FormGroup(label: string, content: Node|Node[]): HTMLElement {
    const containerElement = document.createElement("div");
    containerElement.className = "rounded-lg p-1 bg-neutral-600 text-white";

    const l = document.createElement("label");
    l.className = "block text-sm font-bold mb-1";
    l.innerText = label;

    containerElement.appendChild(l);
    domAppendNodes(containerElement, content)

    return containerElement;
}

export class FormGroupRadio implements IComponent {
    container: HTMLDivElement;
    input: HTMLInputElement;

    constructor(id: string, name: string, value: string, label: string, checked: boolean = false, description?: string ) {
        this.container = document.createElement("div");
        this.container.className = "flex items-center mb-2";

        this.input = document.createElement("input");
        this.input.className = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600";
        this.input.type = "radio";
        this.input.id = id;
        this.input.name = name;
        this.input.value = value;
        this.input.checked = checked;

        const labelElement = document.createElement("label");
        labelElement.htmlFor = id;
        labelElement.className = "ms-2 text-sm font-medium";
        labelElement.innerText = label;

        this.container.appendChild(this.input);
        this.container.appendChild(labelElement);

        if (description) {
            const descriptionElement = document.createElement("p");
            descriptionElement.className = "text-xs text-gray-400 mt-1 ms-6";
            descriptionElement.innerText = description;
            this.container.appendChild(descriptionElement);
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}

export function Button() {
    const button = document.createElement("button");
    button.className = "flex flex-row gap-1 font-bold p-1 px-2 rounded-lg text-neutral-300 bg-neutral-600 hover:bg-neutral-500 disabled:bg-neutral-700 disabled:text-neutral-400";
    return button;
}

export interface ButtonToolbarSeparator {
    type: "separator";
}

export interface ButtonToolbarButton {
    type: "button";
    label: string;
    action: string;
}

export type ButtonToolbarType = ButtonToolbarButton|ButtonToolbarSeparator;

function isButtonToolbarButton(b): b is ButtonToolbarButton {
    return b.type === "button";
}

export function ButtonToolbar(app: ICommandHost, buttonToolbarButtons: (ButtonToolbarButton|ButtonToolbarSeparator)[]) {
    const container = HFlex(null, "gap-1");

    for (let toolbarButton of buttonToolbarButtons) {
        if (isButtonToolbarButton(toolbarButton)) {
            const button = Button();

            const cmd = app.getCommand(toolbarButton.action);

            if (cmd) {
                if (cmd.icon) {
                    const iconSpan = document.createElement("span");
                    iconSpan.className = cmd.icon;
                    button.appendChild(iconSpan);
                }

                const hotkey = app.getHotkeyForCommand(toolbarButton.action);

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
            button.addEventListener("click", () => app.executeCommand(toolbarButton.action));

            container.appendChild(button);
        } else {
            const spacer = document.createElement("div");
            spacer.className = "w-0";
            container.appendChild(spacer);
        }
    }

    return container;
}

export class ModalButtonBar implements IComponent {
    container: HTMLDivElement;
    okButton: HTMLButtonElement;
    cancelButton: HTMLButtonElement;

    constructor(sender: IComponent, parent: INotify) {

        this.container = HFlex(null, "gap-1");

        this.okButton = Button();
        this.okButton.innerText = "OK";
        this.okButton.addEventListener("click", () => parent.notify(sender, "ok"));

        this.cancelButton = Button();
        this.cancelButton.innerText = "Cancel";
        this.cancelButton.addEventListener("click", () => parent.notify(sender, "cancel"));

        this.container.appendChild(this.okButton);
        this.container.appendChild(this.cancelButton);
    }

    getDomNode(): Node {
        return this.container;
    }
}

export function Outset(childNodes?: Node|Node[], classNames: string|string[] = "flex-col") {
    const div = document.createElement("div");
    div.classList.add("x-outset", "flex", "bg-neutral-600", "p-1", "rounded-lg");
    if (Array.isArray(classNames)) {
        div.classList.add(...classNames);
    } else if (classNames) {
        div.classList.add(classNames);
    }

    domAppendNodes(div, childNodes);
    return div;
}

export function Inset(childNodes?: Node|Node[], classNames: string|string[] = "flex-col") {
    const div = document.createElement("div");
    div.classList.add("x-inset", "flex", "bg-neutral-800", "p-1", "rounded-lg");
    if (Array.isArray(classNames)) {
        div.classList.add(...classNames);
    } else if (classNames) {
        div.classList.add(classNames);
    }
    domAppendNodes(div, childNodes);
    return div;
}

export function VFlex(childNodes?: Node|Node[], classNames?: string|string[]) {
    const div = document.createElement("div");
    div.classList.add("x-vflex", "flex", "flex-col");
    if (Array.isArray(classNames)) {
        div.classList.add(...classNames);
    } else if (classNames) {
        div.classList.add(classNames);
    }
    domAppendNodes(div, childNodes);
    return div;
}

export function HFlex(childNodes?: Node|Node[], classNames?: string|string[]) {
    const div = document.createElement("div");
    div.classList.add("x-hflex", "flex", "flex-row");
    if (Array.isArray(classNames)) {
        div.classList.add(...classNames);
    } else if (classNames) {
        div.classList.add(classNames);
    }
    domAppendNodes(div, childNodes);
    return div;
}
