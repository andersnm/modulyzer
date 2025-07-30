import { Appl } from "../App";
import { Bank, Preset, InstrumentDocument } from "../audio/SongDocument";
import { registerPinsCommands } from "../commands/PinsList/Register";
import { presetMenu } from "../menu/menu";
import { CommandButtonBar, ScrollableFlexContainer, StatusBar } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { PinSlider } from "./PinSlider";
import { PresetDropdown } from "./PresetDropdown";

export class PinsPanel extends ViewFrame {
    app: Appl;
    buttonBar: CommandButtonBar;
    listDiv: HTMLDivElement;
    scrollDiv: ScrollableFlexContainer;
    presetDropdown: PresetDropdown;
    statusBar: StatusBar;
    instrument: InstrumentDocument;

    pinRows: PinSlider[] = [];

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerPinsCommands(this);

        this.listDiv  = document.createElement("div");
        this.listDiv.classList.add("flex", "flex-col");

        this.scrollDiv = new ScrollableFlexContainer(this.listDiv);

        this.presetDropdown = new PresetDropdown(this.app);
        this.presetDropdown.menuButton.addEventListener("click", this.onPresetMenuClick);
        this.presetDropdown.presetSelect.addEventListener("change", this.onPresetChange);
        this.addToolbar(this.presetDropdown.getDomNode() as HTMLElement);

        this.setView(this.scrollDiv.getDomNode() as HTMLElement);

        this.statusBar = new StatusBar();
        this.statusBar.addPart(["flex-1"], "<no instrument selected>")

        // NOTE: Adding statusbar in ViewFrame's container
        this.container.appendChild(this.statusBar.getDomNode());
    }

    onPresetMenuClick = async (ev: MouseEvent) => {

        // TODO: menu with local banks

        const rc = (ev.target as HTMLElement).getBoundingClientRect();
        await this.app.contextMenuContainer.show(this, rc.left + ev.offsetX, rc.top + ev.offsetY, presetMenu);
    };

    onPresetChange = async () => {
        if (this.presetDropdown.presetSelect.value === "null") return;

        const index = parseInt(this.presetDropdown.presetSelect.value);
        const preset = this.instrument.bank.presets[index];
        this.setPreset(preset);
    };

    unbind() {
        this.instrument = null;

        while (this.listDiv.childNodes.length > 0) this.listDiv.removeChild(this.listDiv.lastChild);

        this.pinRows.length = 0;

        this.presetDropdown.clearPresets();
        this.statusBar.setText(0, "<no instrument selected>");
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

        this.presetDropdown.bindPresets(instrument.bank.presets);

        this.statusBar.setText(0, instrument.name + " (" + instrument.instrumentId + ")");
    }

    setBank(bank: Bank) {
        this.app.song.setInstrumentBank(this.instrument, bank);
        this.presetDropdown.bindPresets(bank.presets);
    }

    setPreset(preset: Preset) {
        for (let parameterName of Object.keys(preset.parameters)) {
            this.app.song.setInstrumentParameter(this.instrument, parameterName, preset.parameters[parameterName]);

            const pinRow = this.pinRows.find(p => p.parameterName === parameterName);
            pinRow.setValue(preset.parameters[parameterName]);
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
