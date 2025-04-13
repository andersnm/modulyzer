import { Appl } from "../App";
import { DataTable, IComponent } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";

export class PatternsPanel extends ViewFrame {
    app: Appl;
    list: DataTable;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        this.list = new DataTable(this);
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")

        this.setToolbar([
            {
                type: "button",
                label: "New...",
                action: "create-pattern",
            },
        ]);

        this.setView(this.list.getDomNode() as HTMLElement);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async (ev) => {
        this.bind();
        this.app.song.addEventListener("createPattern", this.onUpdate)
        this.app.song.addEventListener("updatePattern", this.onUpdate)
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createPattern", this.onUpdate)
        this.app.song.removeEventListener("updatePattern", this.onUpdate)
    };

    onUpdate = () => {
        this.bind();
    }

    async bind() {
        const selectedIndex = this.list.selectedIndex;

        while (this.list.getRowCount()) this.list.removeRow(0);

        for (let item of this.app.song.patterns) {
            this.list.addRow({
                name: item.name,
                duration: item.duration.toString()
            });
        }

        this.list.setSelectedIndex(Math.min(selectedIndex, this.list.getRowCount() - 1));
    }

    notify(source: IComponent, eventName: string, ...args: any): void {
        if (source === this.list) {
            if (eventName === "dblclick") {
                const index = args[0];
                const pattern = this.app.song.patterns[index];
                this.app.executeCommand("show-pattern-editor", pattern);
            }
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
