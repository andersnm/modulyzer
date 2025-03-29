import { Appl } from "../App";
import { Button, ButtonToolbar, DataTable, IComponent } from "../nutz";
import { formatNote } from "./PatternEditorHelper";

function formatTime(sec: number): string {
    const min = Math.floor(sec / 60);
    sec -= min * 60;
    return min + "m " + Math.floor(sec) + "s";
}

export class RecordingsPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;
    list: DataTable;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.className = "flex flex-col";

        this.buttonBar = ButtonToolbar([
            {
                type: "button",
                icon: "hgi-stroke hgi-plus-sign-square",
                label: "New...",
                click: () => app.executeCommand("create-wave"),
            },
            {
                type: "button",
                icon: "hgi-stroke hgi-folder",
                label: "Open...",
                click: () => app.executeCommand("open-wave"),
            },
        ]);

        this.list = new DataTable(this);
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")
        this.list.addColumn("Note", "note")
        this.list.addColumn("-", "action")

        this.container.appendChild(this.buttonBar);
        this.container.appendChild(this.list.getDomNode());

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async (ev) => {
        this.bind();
        this.app.song.addEventListener("createWave", this.onUpdate);
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createWave", this.onUpdate);
    };

    onUpdate = () => {
        this.bind();
    }

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
        while (this.list.getRowCount()) this.list.removeRow(0);

        let clickedButton = null;

        for (let item of this.app.song.waves) {
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

                await this.app.executeCommand("play-wave", item);

                iconSpan.className = "hgi-stroke hgi-next";
                clickedButton = null;

                e.stopPropagation(); // dont run global handler
                e.preventDefault(); // dont do button default
            });

            this.list.addRow({
                name: item.name,
                duration: formatTime(item.sampleCount / item.sampleRate),
                note: formatNote(item.note),
                action: playButton
                // (item.sampleRate / 1000) + "khz"
            });
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
