import { Appl } from "../App";
import { registerMixerCommands } from "../commands/Mixer/Register";
import { CommandButtonBar } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { MixerCanvas } from "./MixerCanvas";

export class MixerPanel extends ViewFrame {
    app: Appl;
    actionButtons: CommandButtonBar;
    mixerCanvas: MixerCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerMixerCommands(this);

        this.mixerCanvas = new MixerCanvas(app, this);

        this.mixerCanvas.container.addEventListener("selchange", this.onSelChange);

        this.actionButtons = new CommandButtonBar(this, [
            {
                type: "button",
                label: "Add Instrument",
                action: "add-instrument",
            },
            {
                type: "button",
                label: "Delete",
                action: "delete-selection",
            }
        ]);

        this.addToolbar(this.actionButtons.getDomNode() as HTMLElement);

        this.setView(this.mixerCanvas.getDomNode() as HTMLElement);
        this.updateToolbarButtons();
    }

    onSelChange = () => {
        this.updateToolbarButtons();
    };

    updateToolbarButtons() {
        this.setCommandState("delete-selection", { enabled: !!this.mixerCanvas.selectedConnection || !!this.mixerCanvas.selectedInstrument });
    }

    getDomNode(): Node {
        return this.container;
    }
}
