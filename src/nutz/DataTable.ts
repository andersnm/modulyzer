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

function scrollIntoViewIfNeeded(parent: HTMLElement, headerHeight: number, child: HTMLElement) {
    const scrollRect = parent.getBoundingClientRect();
    const parentRect = new DOMRect(scrollRect.left, scrollRect.top + headerHeight, scrollRect.width, scrollRect.height - headerHeight)

    const childRect = child.getBoundingClientRect();

    if (childRect.bottom > parentRect.bottom) {
        const newScrollTop = parent.scrollTop - (parentRect.bottom - childRect.bottom);
        parent.scrollTo(0, newScrollTop);
    }

    if (childRect.top < parentRect.top) {
        const newScrollTop = parent.scrollTop - (parentRect.top - childRect.top);
        parent.scrollTo(0, newScrollTop);
    }
}

export class DataTable implements IComponent {
    parent: INotify;
    columns: {label: string, propertyNameOrIndex: string|number}[] = [];

    container: HTMLDivElement;
    table: HTMLTableElement;
    thead: HTMLTableSectionElement;
    tbody: HTMLTableSectionElement;
    headerRow: HTMLTableRowElement;
    selectedIndex: number = -1;

    constructor(parent: INotify) {
        this.parent = parent;

        this.container = document.createElement("div")
        this.container.classList.add("w-full", "h-full", "relative", "overflow-auto")
        this.container.tabIndex = 0;
        this.container.addEventListener("keydown", this.onKeyDown);

        this.table = document.createElement("table");
        this.table.classList.add("w-full", "grid", "grid-cols-0", "absolute");

        this.thead = document.createElement("thead");
        this.thead.classList.add("contents");

        this.tbody = document.createElement("tbody");
        this.tbody.classList.add("contents");

        this.headerRow = document.createElement("tr");
        this.headerRow.classList.add("contents");

        this.thead.appendChild(this.headerRow);
        this.table.appendChild(this.thead);
        this.table.appendChild(this.tbody);

        this.container.appendChild(this.table);

        // const css = {
        //    "tr.selected td": [ "bg-neutral-200", "text-neutral-700", "bg-neutral-600" ],
        // };
    }

    onKeyDown = (ev: KeyboardEvent) => {
        switch (ev.key) {
            case "ArrowDown":
                this.setSelectedIndex(this.selectedIndex + 1);
                ev.stopPropagation();
                ev.preventDefault();
                break;
            case "ArrowUp":
                this.setSelectedIndex(this.selectedIndex - 1);
                ev.stopPropagation();
                ev.preventDefault();
                break;
            case "PageDown":
                this.setSelectedIndex(this.selectedIndex + 16);
                ev.stopPropagation();
                ev.preventDefault();
                break;
            case "PageUp":
                this.setSelectedIndex(this.selectedIndex - 16);
                ev.stopPropagation();
                ev.preventDefault();
                break;
        }
    };

    addColumn(label: string, propertyNameOrIndex: string|number) {
        this.table.classList.remove("grid-cols-" + this.columns.length);

        this.columns.push({label, propertyNameOrIndex});

        const th = document.createElement("th");
        th.classList.add("select-none", "sticky", "top-0", "bg-neutral-700");
        th.innerText = label;

        this.headerRow.appendChild(th);

        this.table.classList.add("grid-cols-" + this.columns.length);
    }

    addRow(data: any) {
        const row = document.createElement("tr");
        row.classList.add("contents");

        row.addEventListener("click", () => {
            const index = getChildNodeIndex(this.tbody.childNodes, row);
            this.setSelectedIndex(index);
        });

        row.addEventListener("dblclick", () => {
            this.parent.notify(this, "dblclick", this.selectedIndex);
        });

        for (let column of this.columns) {
            const value = data[column.propertyNameOrIndex]??"";
            const td = document.createElement("td");
            td.classList.add("whitespace-nowrap", "select-none", "text-ellipsis", "overflow-hidden");

            if (typeof value === "string") {
                td.innerText = value;
            } else {
                domAppendNodes(td, value);
            }

            row.appendChild(td);
        }

        this.tbody.appendChild(row);

        this.bindRow(row);
    }

    setSelectedIndex(index: number) {
        const totalRows = this.tbody.childNodes.length;
        if (index < -1) {
            index = -1;
        }

        if (index >= totalRows) {
            index = totalRows - 1;
        }

        const oldIndex = this.selectedIndex;
        const oldRow = this.tbody.childNodes[oldIndex] as HTMLElement;

        this.selectedIndex = index;

        // bind old row and nw ro
        if (oldIndex !== -1) {
            this.bindRow(oldRow)
        }

        if (index !== -1) {
            const row = this.tbody.childNodes[index] as HTMLElement;
            this.bindRow(row);

            const bounding = (this.headerRow.childNodes[0] as HTMLElement).getBoundingClientRect();
            scrollIntoViewIfNeeded(this.container, bounding.height, row.childNodes[0] as HTMLElement);
        }

        this.parent.notify(this, "select", index);
    }

    removeRow(index: number) {
        this.tbody.childNodes[index].remove();
    }

    getRowCount() {
        return this.tbody.childNodes.length;
    }

    bindRow(row: HTMLElement) {
        const rowIndex = getChildNodeIndex(this.tbody.childNodes, row);
        row.className = "contents";
        if (rowIndex === this.selectedIndex) {
            row.classList.add("selected");
        }
    }

    getDomNode(): Node {
        return this.container;
    }
}

// Class names generated dynamically:
// grid-cols-0
// grid-cols-1
// grid-cols-2
// grid-cols-3
// grid-cols-4
// grid-cols-5
// grid-cols-6
// grid-cols-7
// grid-cols-8
// grid-cols-9
// grid-cols-10
// grid-cols-11
// grid-cols-12
// grid-cols-13
