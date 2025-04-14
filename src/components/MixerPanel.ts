import { Appl } from "../App";
import { registerMixerCommands } from "../commands/Mixer/Register";
import { ButtonToolbar } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { MixerCanvas } from "./MixerCanvas";

export class MixerPanel extends ViewFrame {
    app: Appl;
    mixerCanvas: MixerCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerMixerCommands(this);

        this.mixerCanvas = new MixerCanvas(app);

        this.addToolbar(ButtonToolbar(this, [
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
        ]));

        this.setView(this.mixerCanvas.getDomNode() as HTMLElement);
    }

    getDomNode(): Node {
        return this.container;
    }
}
