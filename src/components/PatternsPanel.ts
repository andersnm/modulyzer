import { Appl } from "../App";
import { ButtonToolbar, DataTable, IApplication, IComponent } from "../nutz";

export class PatternsPanel implements IComponent {
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
                click: () => app.song.createPattern("Untitled", 16) //app.executeCommand("show-create-new-pattern"),
            },
            // {
            //     type: "button",
            //     icon: "hgi-stroke hgi-refresh",
            //     label: "Refresh...",
            //     click: () => this.bind(),
            //     // action: "refresh-recordings",
            // },
        ]);

        this.list = new DataTable(this);
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")

        this.container.appendChild(this.buttonBar);
        this.container.appendChild(this.list.getDomNode());

        this.app.song.addEventListener("createPattern", () => this.bind())

        this.bind();
    }

    async bind() {
        console.log("binding");

        while (this.list.getRowCount()) this.list.removeRow(0);

        for (let item of this.app.song.patterns) {
            this.list.addRow({
                name: item.name,
                duration: "smell"
            });
        }
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
