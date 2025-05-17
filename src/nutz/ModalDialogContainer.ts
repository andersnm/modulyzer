import { DomElement, DomText } from "./DomText";
import { IComponent } from "./IComponent";
import { Panel } from "./Panel";

interface IModal {
    resolve: (value) => void;
    element: HTMLElement;
    content: HTMLElement;
}

export class ModalDialogContainer {

    focusElement: HTMLElement;
    modalStack: IModal[] = [];

    constructor() {
    }

    async showModal(title: string, content: IComponent, closable: boolean = true) {

        if (this.modalStack.length === 0) {
            this.focusElement = document.activeElement as HTMLElement;
        }

        // insert wrapper in body, render topmost modal
        const wrapperNode = document.createElement("div");
        wrapperNode.className = "relative z-10";

        const dialogOuterNode = document.createElement("div");
        dialogOuterNode.className = "fixed inset-0 z-10 w-screen overflow-y-auto";

        const dialogInnerNode = document.createElement("div");
        dialogInnerNode.className = "flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0";

        const dialogInnerWrapNode = document.createElement("div");
        dialogInnerWrapNode.className = "relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg";

        const closeContainer = document.createElement("span");
        if (closable) {
            closeContainer.addEventListener("click", () => {
                this.endModal();
            });
            closeContainer.classList.add("hgi-stroke", "hgi-cancel-01", "text-white", "cursor-pointer", "hover:bg-neutral-500");
        }

        const dialogPanel = new Panel(new DomText(title), { getDomNode: () => closeContainer } , content);

        dialogInnerWrapNode.appendChild(dialogPanel.getDomNode())
        dialogInnerNode.appendChild(dialogInnerWrapNode);
        dialogOuterNode.appendChild(dialogInnerNode);

        wrapperNode.appendChild(dialogOuterNode);

        document.body.appendChild(wrapperNode);

        (content.getDomNode() as HTMLElement).focus();

        // return promise that resolves when dialog is closed
        // and the content must be able to endDialog too
        return new Promise((resolve) => {
            this.modalStack.push({
                resolve,
                element: wrapperNode,
                content: content.getDomNode() as HTMLElement,
            });
        });
    }

    endModal(value: any = null) {
        const modal = this.modalStack.pop();
        if (!modal) {
            throw new Error("Modal is not open");
        }

        document.body.removeChild(modal.element);
        modal.resolve(value);

        if (this.modalStack.length === 0) {
            if (this.focusElement) {
                this.focusElement.focus();
                this.focusElement = null;
            }
        } else {
            const nextModal = this.modalStack[this.modalStack.length - 1];
            nextModal.content.focus();
        }
    }
}
