import { Appl } from "../App";
import { InstrumentDocument, WaveDocument } from "../audio/SongDocument";
import { waveInstrumentMenu, waveListMenu } from "../menu/menu";
import { Button, CommandHost, DataTable, ICommandHost } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { InstrumentDropdown } from "./InstrumentDropdown";
import { formatNote } from "./PatternEditorHelper";

function formatTime(sec: number): string {
    const min = Math.floor(sec / 60);
    sec -= min * 60;
    return min + "m " + Math.floor(sec) + "s";
}

export class WavesPanel extends ViewFrame {
    app: Appl;
    instrumentDropdown: InstrumentDropdown;
    list: DataTable;
    playButtons: HTMLButtonElement[] = [];

    constructor(app: Appl, parent: CommandHost) {
        super(parent);
        this.app = app;

        this.list = new DataTable();
        this.list.addColumn("", "action")
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")
        this.list.addColumn("Note", "note")
        this.list.container.addEventListener("contextmenu", this.onContextMenu);

        this.instrumentDropdown = new InstrumentDropdown();
        this.instrumentDropdown.menuButton.addEventListener("click", this.onInstrumentMenuClick)

        this.addToolbar(this.instrumentDropdown.getDomNode() as HTMLElement);

        const hotkey = this.getHotkeyForCommand("focus-instrument-dropdown");
        const command = this.getCommand("focus-instrument-dropdown");
        const tooltip = (command?.description ?? command?.name) +  " (" + hotkey + ")"
        this.instrumentDropdown.instrumentSelect.title = tooltip;

        this.setView(this.list.getDomNode() as HTMLElement);

        this.container.addEventListener("keydown", this.onKeyDown);
    }

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

    onInstrumentMenuClick = async (ev: MouseEvent) => {
        const rc = (ev.target as HTMLElement).getBoundingClientRect();
        await this.app.contextMenuContainer.show(this, rc.left + ev.offsetX, rc.top + ev.offsetY, waveInstrumentMenu);
    };

    setInstrument(instrument: InstrumentDocument|null) {
        this.instrumentDropdown.setInstrument(instrument);
    }

    setWave(wave: WaveDocument) {
        const index = wave?.instrument.waves.findIndex(c => c === wave) ?? -1;
        this.list.setSelectedIndex(index);
    }

    getWaveTableInstruments() {
        if (!this.app.player) {
            return [];
        }

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
        const instruments = this.getWaveTableInstruments();
        this.instrumentDropdown.bindInstruments(instruments);
    }

    clearWaves() {
        while (this.list.getRowCount()) this.list.removeRow(0);
    }

    bindWaves(waves: WaveDocument[]) {
        const selectedIndex = this.list.selectedIndex;

        this.clearWaves();
        this.playButtons.length = 0;

        for (let wave of waves) {
            const playButton = Button();
            const iconSpan = document.createElement("span");
            iconSpan.className = "hgi-stroke hgi-next";
            playButton.appendChild(iconSpan);

            playButton.addEventListener("click", async (e: Event) => {

                if (this.app.wavePlayer.node) {
                    await this.app.wavePlayer.stopWave();
                    if (this.app.wavePlayer.source === playButton) {
                        return;
                    }
                }

                iconSpan.className = "hgi-stroke hgi-stop";

                await this.app.wavePlayer.playWave(wave, playButton);

                iconSpan.className = "hgi-stroke hgi-next";

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
