import { IApplication } from "./IApplication";
import { IComponent } from "./IComponent";

export function FormGroup(label: string, content: HTMLElement): HTMLElement {
    const containerElement = document.createElement("div");
    containerElement.className = "mb-4 rounded-lg p-1 bg-neutral-600";

    const l = document.createElement("label");
    l.className = "block text-sm font-bold mb-1";
    l.innerText = label;

    containerElement.appendChild(l);
    containerElement.appendChild(content);

    return containerElement;
}

export function Button() {
    const button = document.createElement("button");
    button.className = "flex flex-row gap-1 font-bold p-1 px-2 rounded-lg text-neutral-300 bg-neutral-600 hover:bg-neutral-500 disabled:bg-neutral-700 disabled:text-neutral-400";
    return button;
}

export interface ButtonToolbarSeparator {
    type: "separator";
}

export interface ButtonToolbarInput {
    type: "input";
    // label: string;
    init: (el: HTMLInputElement) => void;
    change: (el: HTMLInputElement) => void;
}

export interface ButtonToolbarButton {
    type: "button";
    icon: string;
    label: string;
    click: () => void;
}

function isButtonToolbarButton(b): b is ButtonToolbarButton {
    return b.type === "button";
}

function isButtonToolbarInput(b): b is ButtonToolbarInput {
    return b.type === "input";
}

export function ButtonToolbar(buttonToolbarButtons: (ButtonToolbarButton|ButtonToolbarSeparator|ButtonToolbarInput)[]) {
    const container = document.createElement("div");
    container.className = "flex gap-1";

    for (let toolbarButton of buttonToolbarButtons) {
        if (isButtonToolbarButton(toolbarButton)) {
            const button = Button();

            if (toolbarButton.icon) {
                const iconSpan = document.createElement("span");
                iconSpan.className = toolbarButton.icon; // "hgi-stroke hgi-plus-sign-square";
                button.appendChild(iconSpan);
            }

            const t = document.createTextNode(toolbarButton.label)
            button.appendChild(t);

            button.addEventListener("click", toolbarButton.click);

            container.appendChild(button);
        } else if (isButtonToolbarInput(toolbarButton)) {
            const input = document.createElement("input");
            toolbarButton.init(input);
            input.addEventListener("change", () => {
                toolbarButton.change(input);
            })

            container.appendChild(input);
        } else {
            const spacer = document.createElement("div");
            spacer.className = "w-0";
            container.appendChild(spacer);
        }
    }

    return container;
}
