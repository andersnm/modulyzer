import { DomElement, DomText } from "./DomText";
import { IComponent } from "./IComponent";
import { Panel } from "./Panel";

interface IModal {
    resolve: (value) => void;
    element: HTMLElement;
}

export class ModalDialogContainer {

    modalStack: IModal[] = [];

    constructor() {
    }

    async showModal(content: IComponent) {

        // insert wrapper in body, render topmost modal
        //             new NutzElement("div", { className: "relative z-10",
        const wrapperNode = document.createElement("div");
        wrapperNode.className = "relative z-10";

        // overlay = return new NutzElement("div", { className: "fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity",

        const dialogOuterNode = document.createElement("div");
        dialogOuterNode.className = "fixed inset-0 z-10 w-screen overflow-y-auto";

        const dialogInnerNode = document.createElement("div");
        dialogInnerNode.className = "flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0";

        const dialogInnerWrapNode = document.createElement("div");
        dialogInnerWrapNode.className = "relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg";

        const closeContainer = new DomElement("span", (el) => {
            el.addEventListener("click", () => {
                this.endModal();
            });
        }, new DomText("X"));

        const dialogPanel = new Panel(new DomText("Titl"), closeContainer, content);

        dialogInnerWrapNode.appendChild(dialogPanel.getDomNode())
        dialogInnerNode.appendChild(dialogInnerWrapNode);
        dialogOuterNode.appendChild(dialogInnerNode);

        wrapperNode.appendChild(dialogOuterNode);

        document.body.appendChild(wrapperNode);

        // dialog = return new NutzElement("div", {
        // className: "fixed inset-0 z-10 w-screen overflow-y-auto",
        // content: () => new NutzElement("div", {
        //     className: "flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0",
        //     // <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        //     content: () => new NutzElement("div", {
        //         className: "relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg",
        //         content: () => new Panel({

        // return promise tat resulves when dialog is closed
        // and the content must be able to endDialog too
        return new Promise((resolve) => {
            // this.resolveStack.push(resolve);
            
            this.modalStack.push({
                resolve,
                element: wrapperNode
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
    }

}