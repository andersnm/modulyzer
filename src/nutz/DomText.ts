import { IComponent } from "./IComponent";

export class DomText implements IComponent {
    node: Text;

    constructor(protected content: string) {
        this.node = document.createTextNode(this.content);
    }

    getDomNode(): Node {
        return this.node;
    }
}

export type DomElementCallbackType = (el: HTMLElement) => void;

export class DomElement implements IComponent {
    node: HTMLElement;

    constructor(tagName: string, callback: DomElementCallbackType | null, ...contents: IComponent[]) {
        this.node = document.createElement(tagName);
        if (callback) {
            callback(this.node);
        }

        for (let content of contents) {
            const child = content.getDomNode();
            this.node.appendChild(child);
        }
    }

    getDomNode(): Node {
        return this.node;
    }
}

