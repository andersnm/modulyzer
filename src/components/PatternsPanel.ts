import { Appl } from "../App";
import { InstrumentDocument, PatternDocument } from "../audio/SongDocument";
import { registerPatternListCommands } from "../commands/PatternList/Register";
import { patternListMenu } from "../menu/menu";
import { ButtonToolbar, DataTable } from "../nutz";
import { ViewFrame } from "../nutz/ViewFrame";
import { InstrumentDropdown } from "./InstrumentDropdown";
import { PatternFrame } from "./PatternFrame";

export class PatternsPanel extends ViewFrame {
    app: Appl;
    instrumentDropdown: InstrumentDropdown;
    list: DataTable;
    frame: PatternFrame; // TODO: should not short circuit parent access!

    constructor(app: Appl, frame: PatternFrame) {
        super(app);
        this.app = app;
        this.frame = frame;

        registerPatternListCommands(this);

        this.list = new DataTable();
        this.list.addColumn("Name", "name")
        this.list.addColumn("Cols", "columns")
        this.list.addColumn("Sub.", "subdivision")
        this.list.addColumn("Rows", "rows")
        this.list.container.addEventListener("contextmenu", this.onContextMenu);

        this.instrumentDropdown = new InstrumentDropdown();

        this.addToolbar(this.instrumentDropdown.getDomNode() as HTMLElement);

        this.addToolbar(ButtonToolbar(this, [
            {
                type: "button",
                label: "New...",
                action: "create-pattern",
            },
        ]));

        this.setView(this.list.getDomNode() as HTMLElement);
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
