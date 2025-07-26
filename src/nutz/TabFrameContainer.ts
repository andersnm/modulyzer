import { DomText } from "./DomText";
import { IComponent } from "./IComponent";
import { Panel } from "./Panel";
import { VOutset } from "./StandardStuff";
import { Tabs, TabsPositionType } from "./Tabs";

export class TabFrameContainer implements IComponent {

    outer: HTMLElement;
    tabs: Tabs;
    tabContent: IComponent[] = [];

    constructor(protected enableTitle: boolean) {
        this.tabs = new Tabs();
        this.tabs.addEventListener("tabchange", this.onTabChange);

        this.tabs.getDomNode().classList.add("pl-2");

        this.outer = document.createElement("div");
        this.outer.className = "flex flex-col flex-1";
    }

    onTabChange = (e: CustomEvent) => {
        const index = e.detail as number;
        this.setCurrentTab(index);
    };

    bind() {
        while (this.outer.childNodes.length > 0) this.outer.removeChild(this.outer.lastChild);

        const tabs = this.tabs.getDomNode();
        const index = this.tabs.getCurrentTab();
        const tabInfo = this.tabs.tabs[index];
        const tabContent = this.tabContent[index];

        if (this.enableTitle) {
            const panel = new Panel(new DomText(tabInfo.label), new DomText("X"), tabContent);

            this.outer.appendChild(panel.getDomNode());
            this.outer.appendChild(tabs);
        } else {
            this.outer.appendChild(tabs);
            this.outer.appendChild(VOutset(tabContent.getDomNode(), "flex-1"));
        }
    }

    addTab(label: string, content: IComponent) {
        const command = {};
        this.tabs.addTab(label);
        this.tabContent.push(content);

        this.bind();
    }

    setTabsPosition(position: TabsPositionType) {
        this.tabs.setPosition(position);
    }

    setCurrentTab(index) {
        this.tabs.setCurrentTab(index);

        // invalidate to redraw, unmount currnt tb contnt, mount new
        this.bind();

        const element = this.tabContent[index].getDomNode() as HTMLElement;
        element.focus();
    }

    getDomNode() {
        return this.outer;
    }
}
