import { IComponent, INotify } from "./IComponent";
import { ModalDialogContainer } from "./ModalDialogContainer";

// Can use this as notifier for modals that implement the ModalButtonBar
export class ModalOkCancelResolver implements INotify {
    container: ModalDialogContainer;

    constructor(container: ModalDialogContainer) {
        this.container = container;
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (eventName === "ok") {
            // this resolves await showModal
            this.container.endModal(true);
        } else if (eventName === "cancel") {
            // this resolves await showModal
            this.container.endModal(false);
        }
    }
}
