import { Appl } from "../App";
import { PlayerSongAdapter } from "../audio/PlayerSongAdapter";
import { InstrumentDocument, PatternColumnDocument, PatternColumnType } from "../audio/SongDocument";
import { FormGroup, IComponent, VInset, ModalButtonBar, DataTable } from "../nutz";

/** Defines a potential toggleable pattern column in the InstrumentPinPicker.*/
export interface InstrumentColumn {
    checked: boolean;
    type: PatternColumnType;
    name: string;
}

/** Compute InstrumentColumn[] from an instrument and existing columns in a pattern. */
export function convertPatternToInstrumentColumns(playerSongAdapter: PlayerSongAdapter, instrument: InstrumentDocument, columns: PatternColumnDocument[]) {
    const instrumenteer = playerSongAdapter.instrumentMap.get(instrument);

    const result: InstrumentColumn[] = [];

    if (instrumenteer.factory.maxPolyphony > 0) {
        const column = columns.find(c => c.type === "midinote");
        result.push({
            checked: !!column,
            type: "midinote",
            name: undefined,
        });
    }

    for (let parameter of instrumenteer.instrument.parameters) {
        const column = columns.find(c => c.type === "midiparameter" && c.parameterName === parameter.name);

        result.push({
            checked: !!column,
            type: "midiparameter",
            name: parameter.name,
        });
    }

    return result;
}

export class InstrumentPinPicker implements IComponent {
    app: Appl;
    container: HTMLElement;
    buttonBar: ModalButtonBar;
    list: DataTable;

    columns: InstrumentColumn[];

    constructor(app: Appl, columns: InstrumentColumn[]) {
        this.app = app;
        this.columns = [ ...columns ];
        this.container = VInset(undefined, [ "flex-1", "gap-1" ]);
        this.container.tabIndex = -1;

        this.list = new DataTable();
        this.list.container.classList.add("h-60")
        this.list.addColumn("", "checked");
        this.list.addColumn("Name", "name");
        (this.list.thead.childNodes[0] as HTMLElement).classList.add("w-2");
        this.bindParameters();

        const parameterGroup = FormGroup("Parameters", [ VInset(this.list.getDomNode(), "flex-1") ]);

        this.buttonBar = new ModalButtonBar(this.app);

        this.container.appendChild(parameterGroup);
        this.container.appendChild(this.buttonBar.getDomNode());
    }

    bindParameters() {
        while (this.list.getRowCount()) this.list.removeRow(0);

        for (let column of this.columns) {

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = column.checked;

            checkbox.addEventListener("change", () => {
                column.checked = checkbox.checked;
            });

            this.list.addRow({
                checked: checkbox,
                name: column.type === "midinote" ? "Note" : column.name,
            });
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}
