import { Appl } from "../App";
import { CcChangeDetail, Instrument } from "../audio/plugins/InstrumentFactory";
import { InstrumentDocument } from "../audio/SongDocument";
import { ButtonToolbar, IComponent, ScrollableFlexContainer } from "../nutz";
import { PinSlider } from "./PinSlider";

export class PinsPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;
    listDiv: HTMLDivElement;
    scrollDiv: ScrollableFlexContainer;
    instrument: InstrumentDocument;
    playerInstrument: Instrument;

    pinRows: PinSlider[] = [];

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col", "w-full", "h-full");

        // this.buttonBar = ButtonToolbar([]);

        this.listDiv  = document.createElement("div");
        this.listDiv.classList.add("flex", "flex-col");

        this.scrollDiv = new ScrollableFlexContainer(this.listDiv);

        // this.container.appendChild(this.buttonBar);
        this.container.appendChild(this.scrollDiv.getDomNode());
    }

    onCcChange = (ev: CustomEvent<CcChangeDetail>) => {
        const pinRow = this.pinRows.find(p => this.playerInstrument === ev.detail.instrument && p.pin.value === ev.detail.value);
        if (!pinRow) {
            return;
        }

        pinRow.setValue(ev.detail.data);
    }

    unbind() {
        if (this.playerInstrument) {
            this.playerInstrument.removeEventListener("ccchange", this.onCcChange);
        }

        this.playerInstrument = null;

        while (this.listDiv.childNodes.length > 0) this.listDiv.removeChild(this.listDiv.lastChild);

        this.pinRows.length = 0;
    }

    bindInstrument(instrument: InstrumentDocument) {

        this.unbind();

        this.playerInstrument = this.app.playerSongAdapter.instrumentMap.get(instrument);

        const pins = this.playerInstrument.factory.getPins();
        for (let pin of pins) {
            // TODO: note: midi-focus / clickable piano
            if (pin.type === "controller") {
                const pinRow = new PinSlider(this.playerInstrument, pin);
                pinRow.setValue(instrument.ccs[pin.value]);
                this.pinRows.push(pinRow);
                this.listDiv.appendChild(pinRow.getDomNode());
            }
        }

        this.playerInstrument.addEventListener("ccchange", this.onCcChange);
    }

    getDomNode(): Node {
        return this.container;
    }
}
