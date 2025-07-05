import { Appl } from "../App";
import { InstrumentDocument } from "../audio/SongDocument";
import { IComponent } from "../nutz";

export class PinSlider implements IComponent {
    app: Appl;
    instrument: InstrumentDocument;
    parameterName: string;

    container: HTMLDivElement;
    slider: HTMLInputElement;
    valueDiv: HTMLDivElement;

    constructor(app: Appl, instrument: InstrumentDocument, parameterName: string) {
        this.app = app;
        this.instrument = instrument;
        this.parameterName = parameterName;

        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col");

        const nameValueDiv = document.createElement("div");
        nameValueDiv.classList.add("flex", "flex-row");

        const nameDiv = document.createElement("div");
        nameDiv.classList.add("flex-1")
        nameDiv.innerText = parameterName;

        this.valueDiv = document.createElement("div");
        this.valueDiv.classList.add("flex-1", "text-right");

        nameValueDiv.appendChild(nameDiv);
        nameValueDiv.appendChild(this.valueDiv);

        this.container.appendChild(nameValueDiv);

        this.slider = document.createElement("input");
        this.slider.type = "range";
        this.slider.min = "0";
        this.slider.max = "127";
        this.slider.step = "1";

        this.slider.addEventListener("input", () => {
            const parameter = this.app.playerSongAdapter.getParameter(instrument, parameterName);
            const value = parameter.convertMidiToValue(this.slider.valueAsNumber);
            // parameter.setValue(0, value); // direct, does not update document
            this.app.song.setInstrumentParameter(this.instrument, parameterName, value);

            this.setValue(value);
        });

        this.container.appendChild(this.slider);
    }

    setValue(value: number) {
        const parameter = this.app.playerSongAdapter.getParameter(this.instrument, this.parameterName);
        const valueString = parameter.describeValue(value);
        this.valueDiv.innerText = valueString;
        const midiValue = parameter.convertValueToMidi(value);
        this.slider.valueAsNumber = midiValue;
    }

    getDomNode(): Node {
        return this.container;
    }
}