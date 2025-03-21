import { Appl } from "../App";
import { SequenceEditorCanvas } from "./SequenceEditorCanvas";
import { ButtonToolbar, IComponent } from "../nutz";

export interface SequencePanelProps {
    playPosition?: number;
}

export class SequencePanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    toolbar: HTMLElement;
    sequenceEditor: SequenceEditorCanvas;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col flex-1";
        // flex div w/toolbar, wave, scroll stacked vertically
        this.sequenceEditor = new SequenceEditorCanvas(app);

        this.toolbar = ButtonToolbar([
            {
                type: "button",
                label: "Add Column",
                icon: "",
                click: () => {
                    app.song.createSequenceColumn()
                },
            }
        ]);
        this.container.appendChild(this.toolbar);
        this.container.appendChild(this.sequenceEditor.getDomNode());

    }

    getDomNode(): Node {
        return this.container;
    }
}
