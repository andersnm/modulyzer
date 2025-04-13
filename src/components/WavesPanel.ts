import { Appl } from "../App";
import { Button, DataTable, IComponent } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { formatNote } from "./PatternEditorHelper";

function formatTime(sec: number): string {
    const min = Math.floor(sec / 60);
    sec -= min * 60;
    return min + "m " + Math.floor(sec) + "s";
}

export class WavesPanel extends ViewFrame {
    app: Appl;
    list: DataTable;
    playButtons: HTMLButtonElement[] = [];

    constructor(app: Appl) {
        super(app);
        this.app = app;

        this.list = new DataTable(this);
        this.list.addColumn("", "action")
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")
        this.list.addColumn("Note", "note")

        this.setToolbar([
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
        ]);

        this.setView(this.list.getDomNode() as HTMLElement);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
        this.container.addEventListener("keydown", this.onKeyDown);
    }

    onMounted = async (ev) => {
        this.bind();
        this.app.song.addEventListener("createWave", this.onUpdate);
        this.app.song.addEventListener("updateWave", this.onUpdate);
        this.app.song.addEventListener("deleteWave", this.onUpdate);
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createWave", this.onUpdate);
        this.app.song.removeEventListener("updateWave", this.onUpdate);
        this.app.song.removeEventListener("deleteWave", this.onUpdate);
    };

    onUpdate = () => {
        this.bind();
    };

    onKeyDown = (ev: KeyboardEvent) => {
        switch (ev.key) {
            case "v":
            case "V":
                if (!ev.shiftKey && ev.ctrlKey && !ev.altKey && !ev.metaKey) {
                    this.app.executeCommand("paste-new-wave");
                }
                break;
            case "Enter":
                if (this.list.selectedIndex >= 0) {
                    const wave = this.app.song.waves[this.list.selectedIndex];
                    this.app.executeCommand("show-wave-editor", wave);
                }
                ev.preventDefault();
                ev.stopPropagation();
                break;
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

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source === this.list) {
            if (eventName === "dblclick") {
                const index = args[0];
                const wave = this.app.song.waves[index];
                this.app.executeCommand("show-wave-editor", wave);
            }
        }

    }

    bind() {
        const selectedIndex = this.list.selectedIndex;

        while (this.list.getRowCount()) this.list.removeRow(0);
        this.playButtons.length = 0;

        let clickedButton = null;

        for (let wave of this.app.song.waves) {
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
