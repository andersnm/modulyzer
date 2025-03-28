import { Appl } from "../App";
import { ButtonToolbar, IComponent } from "../nutz";
import { InstrumentFactoryPicker } from "./InstrumentFactoryPicker";
import { MixerCanvas } from "./MixerCanvas";

export class MixerPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    mixerCanvas: MixerCanvas;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        // flex div w/toolbar, wave, scroll stacked vertically
        this.mixerCanvas = new MixerCanvas(app);

        this.toolbar = ButtonToolbar([
            {
                type: "button",
                label: "Add Instrument",
                icon: "",
                click: () => this.addInstrument(),
            },
            {
                type: "button",
                label: "Delete",
                icon: "",
                click: () => this.deleteSelection(),
            }

        ]);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.mixerCanvas.getDomNode());
    }

    async addInstrument() {
        const instrumentFactoryPicker = new InstrumentFactoryPicker(this.app, this);
        const result = await this.app.modalDialogContainer.showModal("Select Instrument", instrumentFactoryPicker)
        if (!result) {
            return;
        }

        const factory = this.app.instrumentFactories[instrumentFactoryPicker.instrumentFactoryIndex];
        const instrument = this.app.song.createInstrument(factory.getIdentifier(), "NewInstrument", 0, 0);
    }

    deleteSelection() {
        if (this.mixerCanvas.selectedConnection) {
            this.app.song.deleteConnection(this.mixerCanvas.selectedConnection);
        }

        if (this.mixerCanvas.selectedInstrument) {
            this.app.song.deleteInstrument(this.mixerCanvas.selectedInstrument);
        }
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof InstrumentFactoryPicker) {
            console.log("NOTIFY FROM MODAL")
            if (eventName === "ok") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(true);
            } else if (eventName === "cancel") {
                // this resolves await showModal
                this.app.modalDialogContainer.endModal(false);
            }
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
