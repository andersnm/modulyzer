// import { ComputableModel, NutzComponent, NutzElement, NutzFor, NutzObject, NutzText } from "nutzui";
// import { ModalMenuContainer, ModalMenuItem } from "./ModalMenuContainer";
// import { NutzPlatform } from "nutzui/dist/core/Nutz";

// class MenuProps {
//     items: ModalMenuItem[]; // TODO; NOT MNU ITM! BUT W/OPN FOR OVR-STYLIN
//     position: [number, number];
//     selected: number;
//     index: number;
//     enter: (item: ModalMenuItem, target: Element) => void;
//     moveLeft: (fromMenuIndex: number) => void;
//     action: (item: ModalMenuItem) => void;
//     mount: (el: Element, index) => void;
// }

// export class Menu extends NutzComponent<MenuProps> {
//     menuContainer: ModalMenuContainer;

//     constructor(model: ComputableModel<MenuProps>, menuContainer: ModalMenuContainer) {
//         super(model);
//         this.menuContainer = menuContainer;
//     }

//     mounted(window: NutzPlatform, el: Element) {

//         if (!el.parentNode) {
//             return;
//         }

//         console.log("MOUNT MENU", el)
//         // op, comment node was mounted, but not next actual component)
//         this.dispatch(this.props, "mount", el, this.props.index);
//     }

//     unmounted() {
//         // console.log("UNMOUNT MDNU")
//     }

//     render(): NutzObject[] {

//         // TODO; look up labels (translations) and icons from global command registry

//         return [
//             new NutzElement("div", {
//                 tabIndex: 0,
//                 style: () => "left: " + this.props.position[0] + "px; top: " + this.props.position[1] + "px",

//                 className: "nutz-menu absolute px-1 py-1 bg-neutral-600 rounded w-72",
//                 keydown: (ev: KeyboardEvent) => {
//                     console.log("MENU KEY", ev)
//                     if (ev.key === "ArrowUp") {
//                         if (this.props.selected > 0)
//                             this.props.selected--;
//                     } else
//                     if (ev.key === "ArrowDown") {
//                         if (this.props.selected < this.props.items.length) {
//                             this.props.selected++;
//                         }
//                     } else
//                     if (ev.key === "ArrowLeft") {
//                         // this.props.selected;
//                         // close current menu, goto parent (or previous in menubar)
//                         this.dispatch(this.props, "moveLeft", this.props.index)
//                     } else if (ev.key === "Escape") {
//                     }
//                     ev.preventDefault();
//                     ev.stopPropagation();
//                 },
//                 content: () => [
//                     new NutzElement("div", {
//                         className: "flex flex-col p-1 bg-neutral-800 rounded-lg overflow-auto text-white",
//                         // className: () => item.open ? "bg-neutral-200 text-neutral-700" : "hover:bg-neutral-200 hover:text-neutral-700 ", // TODO; sam styl as ovr if opn
//                         // className: () => claassNaam(it),
//                         content: () => new NutzFor({ items: () => this.props.items, itemCallback: (item, index) => {
//                             // men vi skal ha submenu flyout på en menubar i roten med horizontal stacking
//                             // rendre hele submenyen, og sørge for at flyouts er synlige på hover, men vi skal ha en modell med visible? eller bare css haxxing?
//                             // vil vel ha en absolutt/relativ ting på flyoutene, når visible == true
//                             // always 4 cols; icon  labl  sortcut, xpand

//                             return new NutzElement("div", { 
//                                 className: () => "flex flex-row " + ((item.open || this.props.selected === index) ? "bg-neutral-200 text-neutral-700" : "hover:bg-neutral-200 hover:text-neutral-700 "),
//                                 tabIndex: 0,
//                                 content: () => [
//                                     new NutzElement("div", { 
//                                         className: "w-6",
//                                         // content: () => new NutzText(""),
//                                         content: () => new NutzElement("span", { className: "hgi-stroke " + item.icon }),
//                                     }),
//                                     new NutzElement("div", { 
//                                         className: "flex-1",
//                                         content: () => new NutzText(item.label),
//                                     }),
//                                     new NutzElement("div", { 
//                                         className: "flex-0",
//                                         content: () => new NutzText("Ctrl+F4"),
//                                     }),
//                                     new NutzElement("div", { 
//                                         className: "w-6 text-right",
//                                         content: () => item.index !== -1 ? new NutzText(">") : new NutzText(""),
//                                     }),
//                                 ],

//                                 mouseenter: (ev: MouseEvent) => {
//                                     // vi skal sette open til true, men også lukke ting i parent
//                                     // this.enterItem(item, ev.target as Element);
//                                     this.props.selected = index;
//                                     this.dispatch(this.props, "enter", item, ev.target as Element);
//                                 },

//                                 click: (ev: MouseEvent) => {
//                                     this.dispatch(this.props, "action", item);
//                                     // executeCommand(item.action);
//                                 },

//                             });

//                         }})
//                     })
//                 ],
                
//             })
            
//         ];
//     }
// }

