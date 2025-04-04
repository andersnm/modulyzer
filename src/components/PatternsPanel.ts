import { Appl } from "../App";
import { ButtonToolbar, DataTable, IComponent, ScrollableFlexContainer } from "../nutz";

export class PatternsPanel implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: HTMLElement;
    list: DataTable;

    constructor(app: Appl) {
        this.app = app;
        this.container = document.createElement("div");
        this.container.classList.add("flex", "flex-col", "w-full", "h-full");

        this.buttonBar = ButtonToolbar(this.app, [
            {
                type: "button",
                label: "New...",
                action: "create-pattern",
            },
        ]);

        this.list = new DataTable(this);
        this.list.addColumn("Name", "name")
        this.list.addColumn("Duration", "duration")

        const scrollArea = new ScrollableFlexContainer(this.list.getDomNode());

        this.container.appendChild(this.buttonBar);
        this.container.appendChild(scrollArea.getDomNode());

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
