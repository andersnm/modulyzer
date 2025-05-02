import { Appl } from "../App";
import { InstrumentDocument } from "../audio/SongDocument";
import { registerWaveTableCommands } from "../commands/WaveTable/Register";
import { waveListMenu } from "../menu/menu";
import { Button, ButtonToolbar, DataTable, IComponent, INotify } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { formatNote } from "./PatternEditorHelper";
import { WavePanel } from "./WavePanel";

function formatTime(sec: number): string {
    const min = Math.floor(sec / 60);
    sec -= min * 60;
    return min + "m " + Math.floor(sec) + "s";
}

export class InstrumentDropdown implements IComponent {
    panel: INotify;
    container: HTMLDivElement;
    instrumentSelect: HTMLSelectElement;
    instrument: InstrumentDocument;

    constructor(panel: INotify) {
        this.panel = panel;
        this.container = document.createElement("div");
        this.container.classList.add("flex", "gap-1", "items-center", "flex-1");

        this.instrumentSelect = document.createElement("select");
        this.instrumentSelect.className = "flex-1 rounded-lg p-1 text-neutral-300 bg-neutral-600";
        this.instrumentSelect.addEventListener("change", () => {
            const name = this.instrumentSelect.value;
            this.panel.notify(this, "change", name);
        });

        this.container.appendChild(this.instrumentSelect);
    }

    setInstrument(instrument: InstrumentDocument) {
        this.instrument = instrument;
        this.instrumentSelect.value = instrument?.name??null;
    }

    bindInstruments(instruments: InstrumentDocument[]) {
        while (this.instrumentSelect.options.length > 0) this.instrumentSelect.options.remove(0);

        for (let instrument of instruments) {
            const opt = document.createElement("option")
            opt.value = instrument.name; // TODO? assume unique
            opt.label = instrument.name;
            opt.selected = (this.instrument === instrument);
            this.instrumentSelect.options.add(opt);
        }

        if (this.instrumentSelect.options.length === 0) {
            const opt = document.createElement("option")
            opt.value = null;
            opt.label = "<no instruments using wave table>";
            opt.selected = true;
            this.instrumentSelect.options.add(opt);
            this.instrumentSelect.disabled = true;
        } else {
            this.instrumentSelect.disabled = false;
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}

export class WavesPanel extends ViewFrame {
    app: Appl;
    instrument: InstrumentDocument|null = null;
    instrumentDropdown: InstrumentDropdown;
    list: DataTable;
    playButtons: HTMLButtonElement[] = [];

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerWaveTableCommands(this);

        this.list = new DataTable(this);
        this.list.addColumn("", "action")
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")
        this.list.addColumn("Note", "note")
        this.list.container.addEventListener("contextmenu", this.onContextMenu);

        this.instrumentDropdown = new InstrumentDropdown(this);
        this.addToolbar(this.instrumentDropdown.getDomNode() as HTMLElement);

        this.addToolbar(ButtonToolbar(this, [
            {
                type: "button",
                label: "New...",
                action: "create-wave",
            },
            {
                type: "button",
                label: "Open...",
                action: "open-wave",
            },
            {
                type: "button",
                label: "Paste New",
                action: "paste-new-wave",
            },
        ]));

        this.setView(this.list.getDomNode() as HTMLElement);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
        this.container.addEventListener("keydown", this.onKeyDown);
    }

    onMounted = async (ev) => {
        this.bindInstruments();
        this.bind();
        this.app.song.addEventListener("createInstrument", this.onUpdateInstruments);
        this.app.song.addEventListener("deleteInstrument", this.onUpdateInstruments);

        this.app.song.addEventListener("createWave", this.onUpdate);
        this.app.song.addEventListener("updateWave", this.onUpdate);
        this.app.song.addEventListener("deleteWave", this.onUpdate);
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createInstrument", this.onUpdateInstruments);
        this.app.song.removeEventListener("deleteInstrument", this.onUpdateInstruments);

        this.app.song.removeEventListener("createWave", this.onUpdate);
        this.app.song.removeEventListener("updateWave", this.onUpdate);
        this.app.song.removeEventListener("deleteWave", this.onUpdate);
    };

    onUpdate = () => {
        this.bind();
    };

    onUpdateInstruments = (e: CustomEvent<InstrumentDocument>) => {
        this.bindInstruments();
    };

    onKeyDown = async (ev: KeyboardEvent) => {
        switch (ev.key) {
            case " ":
                if (this.list.selectedIndex >= 0) {
                    const playButton = this.playButtons[this.list.selectedIndex];
                    playButton.click();
                }
                ev.preventDefault();
                ev.stopPropagation();
                break;
        }
    };

    onContextMenu = (e: MouseEvent) => {
        e.preventDefault();

        if (this.list.selectedIndex === -1) {
            return;
        }

        const rc = (e.target as HTMLElement).getBoundingClientRect();
        this.app.contextMenuContainer.show(this, rc.left + e.offsetX, rc.top + e.offsetY, waveListMenu);
    }

    async notify(source: IComponent, eventName: string, ...args: any) {
        if (source === this.list) {
            if (eventName === "dblclick") {
                const index = args[0];
                const wave = this.instrument.waves[index];
                const panel = await this.app.executeCommand("show-wave-editor", wave) as WavePanel;
                panel.setWave(wave);
            }
        } else if (source === this.instrumentDropdown) {
            if (eventName === "change") {
                const name = args[0];
                const instrument = this.app.song.instruments.find(i => i.name === name);
                this.setInstrument(instrument);
            }
        }
    }

    ensureInstrument() {
        const instruments = this.getWaveTableInstruments();

        if (this.instrument) {
            const index = instruments.indexOf(this.instrument);
            if (index !== -1) {
                return;
            }

            this.setInstrument(null);
        }

        if (instruments.length === 0) {
            return;
        }

        this.setInstrument(instruments[0]);
    }

    setInstrument(instrument: InstrumentDocument|null) {
        this.instrument = instrument ?? null;
        this.instrumentDropdown.setInstrument(this.instrument);
        this.bind();
    }

    getWaveTableInstruments() {
        const result: InstrumentDocument[] = [];
        for (let instrument of this.app.song.instruments) {
            const factory = this.app.player.getInstrumentFactoryById(instrument.instrumentId);
            if (!factory.useWaveTable) {
                continue;
            }

            result.push(instrument);
        }

        return result;
    }

    bindInstruments() {
        this.ensureInstrument();

        const instruments = this.getWaveTableInstruments();
        this.instrumentDropdown.bindInstruments(instruments);
        this.instrumentDropdown.setInstrument(this.instrument);
    }

    bind() {
        const selectedIndex = this.list.selectedIndex;

        while (this.list.getRowCount()) this.list.removeRow(0);
        this.playButtons.length = 0;

        if (this.instrument === null) {
            return;
        }

        let clickedButton = null;

        for (let wave of this.instrument.waves) {
            const playButton = Button();
            const iconSpan = document.createElement("span");
            iconSpan.className = "hgi-stroke hgi-next";
            playButton.appendChild(iconSpan);

            playButton.addEventListener("click", async (e: Event) => {

                if (clickedButton === playButton) {
                    this.app.wavePlayer.stopWave();
                    return;
                }

                clickedButton = playButton;
                iconSpan.className = "hgi-stroke hgi-stop";

                await this.app.wavePlayer.playWave(wave);

                iconSpan.className = "hgi-stroke hgi-next";
                clickedButton = null;

                e.stopPropagation(); // dont run global handler
                e.preventDefault(); // dont do button default
            });

            this.list.addRow({
                name: wave.name,
                duration: formatTime(wave.sampleCount / wave.sampleRate),
                note: formatNote(wave.note),
                action: playButton
                // (item.sampleRate / 1000) + "khz"
            });

            this.playButtons.push(playButton);
        }

        this.list.setSelectedIndex(Math.min(selectedIndex, this.list.getRowCount() - 1));
    }
}
