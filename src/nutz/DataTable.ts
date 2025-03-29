import { domAppendNodes } from "./DomUtil";
import { IComponent, INotify } from "./IComponent";

function getChildNodeIndex(childNodes, node) {
    let index = 0;
    for (let childNode of childNodes) {
        if (childNode === node) {
            return index;
        }
        index++
    }

    return -1;
}

export class DataTable implements IComponent {
    parent: INotify;
    columns: {label: string, propertyNameOrIndex: string|number}[] = [];

    table: HTMLElement;
    headerRow: HTMLTableRowElement;
    selectedIndex: number = -1;

    constructor(parent: INotify) {
        this.parent = parent;
        this.table = document.createElement("table");
        this.table.className = "w-full";

        this.headerRow = document.createElement("tr");

        this.table.appendChild(this.headerRow);
    }

    addColumn(label: string, propertyNameOrIndex: string|number) {
        this.columns.push({label, propertyNameOrIndex});

        const th = document.createElement("th");
        th.innerText = label;

        this.headerRow.appendChild(th);
    }

    addRow(data: any) {
        const row = document.createElement("tr");

        row.addEventListener("click", () => {
            const index = getChildNodeIndex(this.table.childNodes, row) - 1;
            this.setSelectedIndex(index);
        });

        row.addEventListener("dblclick", () => {
            this.parent.notify(this, "dblclick", this.selectedIndex);
        });

        for (let column of this.columns) {
            const value = data[column.propertyNameOrIndex];
            const td = document.createElement("td");
            td.classList.add("whitespace-nowrap");

            if (typeof value === "string") {
                td.innerText = value;
            } else {
                domAppendNodes(td, value);
            }

            row.appendChild(td);
        }

        this.table.appendChild(row);

        this.bindRow(row);
    }

    setSelectedIndex(index: number) {
        const oldIndex = this.selectedIndex;
        const oldRow = this.table.childNodes[oldIndex + 1];

        this.selectedIndex = index;

        // bind old row and nw ro
        if (oldIndex !== -1) {
            this.bindRow(oldRow)
        }

        if (index !== -1) {
            const row = this.table.childNodes[index + 1];
            this.bindRow(row)
        }

        this.parent.notify(this, "select", index);
    }

    removeRow(index: number) {
        this.table.childNodes[index + 1].remove();
    }

    getRowCount() {
        return this.table.childNodes.length - 1;
    }


    bindRow(row) {
        const rowIndex = getChildNodeIndex(this.table.childNodes, row) - 1;
        if (rowIndex === this.selectedIndex) {
            row.className = "text-neutral-700 bg-neutral-200";
        } else {
            row.className = "";
        }
    }

    getDomNode(): Node {
        return this.table;
    }
}
