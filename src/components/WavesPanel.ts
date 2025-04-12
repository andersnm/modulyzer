import { Appl } from "../App";
import { readClipboardWave } from "../Clipboard";
import { Button, ButtonToolbar, DataTable, IComponent, ScrollableFlexContainer } from "../nutz";
import { formatNote } from "./PatternEditorHelper";

function formatTime(sec: number): string {
    const min = Math.floor(sec / 60);
    sec -= min * 60;
    return min + "m " + Math.floor(sec) + "s";
}

export class WavesPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;
    list: DataTable;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col", "w-full", "h-full");
        this.container.tabIndex = 0;

        this.buttonBar = ButtonToolbar(this.app, [
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

        this.list = new DataTable(this);
        this.list.addColumn("", "action")
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")
        this.list.addColumn("Note", "note")

        const scrollDiv = new ScrollableFlexContainer(this.list.getDomNode())

        this.container.appendChild(this.buttonBar);
        this.container.appendChild(scrollDiv.getDomNode());

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
            case "ArrowDown":
                this.list.setSelectedIndex(this.list.selectedIndex + 1);
                break;
            case "ArrowUp":
                this.list.setSelectedIndex(this.list.selectedIndex - 1);
                break;
            case "PageDown":
                this.list.setSelectedIndex(this.list.selectedIndex + 16);
                break;
            case "PageUp":
                this.list.setSelectedIndex(this.list.selectedIndex - 16);
                break;
            case "Enter":
                if (this.list.selectedIndex >= 0) {
                    const wave = this.app.song.waves[this.list.selectedIndex];
                    this.app.executeCommand("show-wave-editor", wave);
                }
                break;
            case " ":
                if (this.list.selectedIndex >= 0) {
                    const playButton = this.playButtons[this.list.selectedIndex];
                    playButton.click();
                }
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

    playButtons: HTMLButtonElement[] = [];

    bind() {
        while (this.list.getRowCount()) this.list.removeRow(0);
        this.playButtons.length = 0;

        let oldIndex = this.list.selectedIndex;

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

        if (oldIndex >= this.list.getRowCount()) {
            oldIndex = this.list.getRowCount() - 1;
        }

        this.list.setSelectedIndex(oldIndex);
    }

    getDomNode(): Node {
        return this.container;
    }
}
