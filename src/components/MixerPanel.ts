import { Appl } from "../App";
import { registerMixerCommands } from "../commands/Mixer/Register";
import { ButtonToolbar, CommandHost, formatHotkey, IComponent } from "../nutz";
import { MixerCanvas } from "./MixerCanvas";

export class MixerPanel extends CommandHost implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    mixerCanvas: MixerCanvas;

    constructor(app: Appl) {
        super(app);
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        this.container.tabIndex = -1; // elements that should not be navigated to directly

        this.mixerCanvas = new MixerCanvas(app);

        this.toolbar = ButtonToolbar([
            {
                type: "button",
                label: "Add Instrument",
                icon: "",
                click: () => this.executeCommand("add-instrument"),
            },
            {
                type: "button",
                label: "Delete",
                icon: "",
                click: () => this.executeCommand("delete-selection"),
            }

        ]);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.mixerCanvas.getDomNode());

        this.container.addEventListener("keydown", this.onKeyDown);

        registerMixerCommands(this);
    }

    onKeyDown = (e: KeyboardEvent) => {
        const keyName = formatHotkey(e);
        const hotkeyCommand = this.hotkeys[keyName];
        // console.log(keyName)
        if (hotkeyCommand) {
            this.executeCommand(hotkeyCommand);
            e.stopPropagation();
            e.preventDefault();
        }
    };

    getDomNode(): Node {
        return this.container;
    }
}
