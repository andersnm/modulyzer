import { IComponent } from "./IComponent";

export type TabsPositionType = "top" | "bottom";

export interface TabInfo {
    label: string;
    tab: HTMLElement;
    index: number;
    handler: () => void;
}

export class Tabs extends EventTarget implements IComponent {
    private position: TabsPositionType = "top";
    tabs: TabInfo[] = [];
    private currentTab: number = 0;

    tabsContainer: HTMLElement;

    constructor() {
        super();
        this.tabsContainer = document.createElement("div");
        this.tabsContainer.className = "flex gap-1 bg-neutral-800";
        this.tabsContainer.addEventListener("mousedown", e => e.preventDefault() ); // prevent taking focus
    }

    addTab(label: string) {
        //    for; this.props.tabs
        //    "div", className: () => "font-bold py-1 px-2 hover:underline " 
        const index = this.tabs.length;
        const tab = {
            label: label,
            tab: document.createElement("div"),
            index,
            handler: () => {
                this.dispatchEvent(new CustomEvent("tabchange", { detail: index }));
            },
        };

        tab.tab.addEventListener("click", tab.handler);

        this.tabs.push(tab);
        this.bindTab(tab);
        this.tabsContainer.appendChild(tab.tab);
    }

    setCurrentTab(index) {
        this.currentTab = index;
        this.bind();
    }

    getCurrentTab() {
        return this.currentTab;
    }

    setPosition(position: TabsPositionType) {
        this.position = position;
        this.bind();
    }

    bindTab(tab: TabInfo) {
        tab.tab.innerHTML = tab.label;
        tab.tab.className = "font-bold py-1 px-2 hover:underline " + 
            (this.position === "top" ? "rounded-t-lg " : "rounded-b-lg ") +
            (this.currentTab === tab.index ? "bg-neutral-600 text-white" : "bg-neutral-800 hover:bg-neutral-600 text-gray-400");
    }

    bind() {
        // !! vis top/bottom endres, swap  - not here
        // call after invalidate
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            this.bindTab(tab);
        }
    }

    getDomNode() {
        return this.tabsContainer;
    }
}
