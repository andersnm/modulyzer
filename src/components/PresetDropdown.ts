import { Appl } from "../App";
import { Preset } from "../audio/SongDocument";
import { Button, IComponent } from "../nutz";

export class PresetDropdown implements IComponent {
    app: Appl;
    container: HTMLDivElement;
    presetSelect: HTMLSelectElement;
    menuButton: HTMLButtonElement;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.classList.add("flex", "gap-1", "items-center", "flex-1");

        const label = document.createElement("span");
        label.innerText = "Preset:";
        label.classList.add("text-white");

        this.presetSelect = document.createElement("select");
        this.presetSelect.className = "flex-1 rounded-lg p-1 text-neutral-300 bg-neutral-600";

        this.menuButton = Button();
        this.menuButton.classList.add("hgi-stroke", "hgi-menu-01");

        this.container.appendChild(label);
        this.container.appendChild(this.presetSelect);
        this.container.appendChild(this.menuButton);
    }

    clearPresets() {
        while (this.presetSelect.options.length > 0) this.presetSelect.options.remove(0);
    }

    bindPresets(presets: Preset[]) {
        this.clearPresets();

        const opt = document.createElement("option");
        opt.value = null;
        opt.label = "<select a preset>";
        this.presetSelect.appendChild(opt);

        let index = 0;
        for (let preset of presets) {
            const opt = document.createElement("option");
            opt.value = index.toString();
            opt.label = preset.name;
            this.presetSelect.appendChild(opt);
            index++;
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}