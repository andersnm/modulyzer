import { Appl } from "../App";
import { registerPatternListCommands } from "../commands/PatternList/Register";
import { patternListMenu } from "../menu/menu";
import { ButtonToolbar, DataTable, IComponent, MenuItem } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { PatternPanel } from "./PatternPanel";

export class PatternsPanel extends ViewFrame {
    app: Appl;
    list: DataTable;

    constructor(app: Appl) {
        super(app);
        this.app = app;

        registerPatternListCommands(this);

        this.list = new DataTable(this);
        this.list.addColumn("Name", "name")
        this.list.addColumn("Cols", "columns")
        this.list.addColumn("Sub.", "subdivision")
        this.list.addColumn("Rows", "rows")
        this.list.container.addEventListener("contextmenu", this.onContextMenu);

        this.addToolbar(ButtonToolbar(this, [
            {
                type: "button",
                label: "New...",
                action: "create-pattern",
            },
        ]));

        this.setView(this.list.getDomNode() as HTMLElement);

        this.container.addEventListener("nutz:mounted", this.onMounted);
        this.container.addEventListener("nutz:unmounted", this.onUnmounted);
    }

    onMounted = async (ev) => {
        this.bind();
        this.app.song.addEventListener("createPattern", this.onUpdate)
        this.app.song.addEventListener("updatePattern", this.onUpdate)
        this.app.song.addEventListener("createPatternColumn", this.onUpdate)
        this.app.song.addEventListener("deletePatternColumn", this.onUpdate)
    };

    onUnmounted = async (ev) => {
        this.app.song.removeEventListener("createPattern", this.onUpdate)
        this.app.song.removeEventListener("updatePattern", this.onUpdate)
        this.app.song.removeEventListener("createPatternColumn", this.onUpdate)
        this.app.song.removeEventListener("deletePatternColumn", this.onUpdate)
    };

    onUpdate = () => {
        this.bind();
    }

    onContextMenu = (e: MouseEvent) => {
        e.preventDefault();

        if (this.list.selectedIndex === -1) {
            return;
        }

        const rc = (e.target as HTMLElement).getBoundingClientRect();
        this.app.contextMenuContainer.show(this, rc.left + e.offsetX, rc.top + e.offsetY, patternListMenu);
    }

    async bind() {
        const selectedIndex = this.list.selectedIndex;

        while (this.list.getRowCount()) this.list.removeRow(0);

        for (let item of this.app.song.patterns) {
            this.list.addRow({
                name: item.name,
                columns: item.columns.length.toString(),
                rows: item.duration.toString(),
                subdivision: item.subdivision.toString(),
            });
        }

        this.list.setSelectedIndex(Math.min(selectedIndex, this.list.getRowCount() - 1));
    }

    async notify(source: IComponent, eventName: string, ...args: any) {
        if (source === this.list) {
            if (eventName === "dblclick") {
                const index = args[0];
                const pattern = this.app.song.patterns[index];
                const panel = await this.app.executeCommand("show-pattern-editor") as PatternPanel;
                panel.setPattern(pattern);
            }
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
