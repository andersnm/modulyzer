import { Appl } from "../App";
import { InstrumentDocument } from "../audio/SongDocument";
import { CommandButtonBar, ScrollableFlexContainer } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { PinSlider } from "./PinSlider";

export class PinsPanel extends ViewFrame {
    app: Appl;
    buttonBar: CommandButtonBar;
    listDiv: HTMLDivElement;
    scrollDiv: ScrollableFlexContainer;
    instrument: InstrumentDocument;

    pinRows: PinSlider[] = [];

    constructor(app: Appl) {
        super(app);
        this.app = app;

        this.listDiv  = document.createElement("div");
        this.listDiv.classList.add("flex", "flex-col");

        this.scrollDiv = new ScrollableFlexContainer(this.listDiv);

        this.setView(this.scrollDiv.getDomNode() as HTMLElement);
    }

    unbind() {
        this.instrument = null;

        while (this.listDiv.childNodes.length > 0) this.listDiv.removeChild(this.listDiv.lastChild);

        this.pinRows.length = 0;
    }

    async bindInstrument(instrument: InstrumentDocument) {

        this.unbind();

        this.instrument = instrument;

        const playerInstrument = this.app.playerSongAdapter.instrumentMap.get(this.instrument);

        for (let parameter of playerInstrument.parameters) {
            const pinRow = new PinSlider(this.app, this.instrument, parameter.name);
            pinRow.setValue(parameter.getValue());

            this.pinRows.push(pinRow);
            this.listDiv.appendChild(pinRow.getDomNode());
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
