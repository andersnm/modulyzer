import { Instrument, Pin } from "../audio/plugins/InstrumentFactory";
import { IComponent } from "../nutz";

export class PinSlider implements IComponent {
    container: HTMLDivElement;
    slider: HTMLInputElement;
    valueDiv: HTMLDivElement;
    playerInstrument: Instrument;
    pin: Pin;

    constructor(playerInstrument: Instrument, pin: Pin) {
        this.playerInstrument = playerInstrument;
        this.pin = pin;

        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col");

        const nameValueDiv = document.createElement("div");
        nameValueDiv.classList.add("flex", "flex-row");

        const nameDiv = document.createElement("div");
        nameDiv.classList.add("flex-1")
        nameDiv.innerText = pin.name;

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
            playerInstrument.sendMidi(0, 0xB0, pin.value, this.slider.valueAsNumber);
        });

        this.container.appendChild(this.slider);
    }

    setValue(value: number) {
        const valueString = this.playerInstrument.factory.describeCcValue(this.pin.value, value);
        this.valueDiv.innerText = valueString;
        this.slider.valueAsNumber = value;
    }

    getDomNode(): Node {
        return this.container;
    }
}