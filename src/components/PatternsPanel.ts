import { Appl } from "../App";
import { InstrumentDocument, PatternDocument } from "../audio/SongDocument";
import { patternListMenu } from "../menu/menu";
import { ButtonToolbar, DataTable, GridFrame, ICommandHost, IComponent, VInset } from "../nutz";
import { InstrumentDropdown } from "./InstrumentDropdown";

export class PatternsPanel extends GridFrame {
    app: Appl;
    instrumentDropdown: InstrumentDropdown;
    list: DataTable;

    constructor(app: Appl, parent: ICommandHost) {
        super(parent);
        this.app = app;

        this.list = new DataTable();
        this.list.addColumn("Name", "name")
        this.list.addColumn("Cols", "columns")
        this.list.addColumn("Sub.", "subdivision")
        this.list.addColumn("Rows", "rows")
        this.list.container.addEventListener("contextmenu", this.onContextMenu);

        this.instrumentDropdown = new InstrumentDropdown();

        this.grid.addFrame("top", VInset(this.instrumentDropdown.getDomNode()), undefined, 1);

        // TODO: move into context menu
        this.grid.addFrame("top", VInset(ButtonToolbar(this, [
            {
                type: "button",
                label: "New...",
                action: "create-pattern",
            },
        ])), undefined, 1);

        this.grid.addFrame("main", VInset(this.list.getDomNode() as HTMLElement, "flex-1"));
    }

    onContextMenu = (e: MouseEvent) => {
        e.preventDefault();

        if (this.list.selectedIndex === -1) {
            return;
        }

        const rc = (e.target as HTMLElement).getBoundingClientRect();
        this.app.contextMenuContainer.show(this, rc.left + e.offsetX, rc.top + e.offsetY, patternListMenu);
    }

    bindInstruments(instruments: InstrumentDocument[]) {
        const selectedValue = this.instrumentDropdown.instrumentSelect.value;
        this.instrumentDropdown.bindInstruments(instruments);
        this.instrumentDropdown.instrumentSelect.value = selectedValue;
    }

    bindPatternList(patterns: PatternDocument[]) {
        const selectedIndex = this.list.selectedIndex;

        while (this.list.getRowCount()) this.list.removeRow(0);

        for (let item of patterns) {
            this.list.addRow({
                name: item.name,
                columns: item.columns.length.toString(),
                rows: item.duration.toString(),
                subdivision: item.subdivision.toString(),
            });
        }

        this.list.setSelectedIndex(Math.min(selectedIndex, this.list.getRowCount() - 1));
    }

    setInstrument(instrument: InstrumentDocument) {
        this.instrumentDropdown.setInstrument(instrument);
    }

    setPattern(pattern: PatternDocument) {
        const index = pattern?.instrument.patterns.indexOf(pattern) ?? -1;
        this.list.setSelectedIndex(index);
    }

    getDomNode(): Node {
        return this.container;
    }
}
