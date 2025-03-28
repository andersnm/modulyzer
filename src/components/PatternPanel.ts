import { Appl } from "../App";
import { PatternDocument } from "../audio/SongDocument";
import { ButtonToolbar, IComponent } from "../nutz";
import { InstrumentPinPicker } from "./InstrumentPinPicker";
import { PatternEditorCanvas } from "./PatternEditorCanvas";

export class PatternPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    patternEditor: PatternEditorCanvas;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        // flex div w/toolbar, wave, scroll stacked vertically
        this.patternEditor = new PatternEditorCanvas(app);

        this.toolbar = ButtonToolbar([
            {
                type: "button",
                label: "Add Column",
                icon: "",
                click: () => {
                    // modal select instrument + pin(s)
                    // app.song.createPatternColumn()
                    this.addColumn();
                },
            }
        ]);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.patternEditor.getDomNode());
    }

    async addColumn() {
        const instrumentPinPicker = new InstrumentPinPicker(this.app, this);
        const result = await this.app.modalDialogContainer.showModal("Select Instrument and Pin", instrumentPinPicker)
        if (!result) {
            return;
        }

        const instrument = this.app.song.instruments[instrumentPinPicker.instrumentIndex];
        this.app.song.createPatternColumn(this.patternEditor.pattern, instrument, instrumentPinPicker.pinIndex);
    }

    setPattern(pattern: PatternDocument) {
        this.patternEditor.setPattern(pattern);
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source instanceof InstrumentPinPicker) {
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
