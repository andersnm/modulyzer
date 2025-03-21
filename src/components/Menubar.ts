// import { ComputableModel, NutzComponent, NutzElement, NutzFor, NutzObject, NutzText } from "nutzui";
// import { ModalMenu, ModalMenuContainer, ModalMenuItem } from "./ModalMenuContainer";
// import { MenuItem } from "../menu/menu";
// import { NutzPlatform } from "nutzui/dist/core/Nutz";

// function preventNextButtonUp() {
//     const up = (ev) => {
//         window.removeEventListener("pointerup", up, true);
//         ev.stopPropagation();
//     };
//     window.addEventListener("pointerup", up, true);
// }

// function getNextElement(el: Element): HTMLElement {
//     if (el.nextElementSibling) {
//         return el.nextElementSibling as HTMLElement;
//     }

//     return el.parentElement.querySelector("[tabindex]");
// }

// function getPreviousElement(el: Element): HTMLElement {
//     if (el.previousElementSibling) {
//         return el.previousElementSibling as HTMLElement;
//     }

//     return el.parentElement.querySelector("[tabindex]:last-child");
// }

// interface MenubarProps {
//     items: MenuItem[];
//     action: (item: MenuItem) => void;
// }

// export class Menubar extends NutzComponent<MenubarProps> {
//     menuContainer: ModalMenuContainer;

//     constructor(model: ComputableModel<MenubarProps>, menuContainer: ModalMenuContainer) {
//         super(model);
//         this.menuContainer = menuContainer;
//     }

//     render(): NutzObject[] {

//         const dispatchAction = (item) => {
//             if (!item) {
//                 open = false;
//                 this.menuContainer.reset();
//             } else {
//                 this.dispatch(this.props, "action", item);
//             }
//         };

//         // let clickElement;
//         let open = false;
//         return [
//             new NutzElement("div", { 
//                 className: "flex flex-row nutz-menubar",
//                 content: () => [
//                     new NutzFor({
//                         items: () => this.props.items,
//                         itemCallback: (item) => {
//                             return new NutzElement("div", {
//                                 className: "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100 px-1 rounded",
//                                 tabIndex: 0,
//                                 content:  () => new NutzText(item.label),
//                                 keydown: (ev) => {
//                                     console.log("menubar key", ev)
//                                     // mov focus
//                                     const el = ev.target as HTMLElement;
//                                     if (ev.key == "ArrowRight") {
//                                         getNextElement(el).focus();
//                                         ev.preventDefault();
//                                     } else 
//                                     if (ev.key == "ArrowLeft") {
//                                         getPreviousElement(el).focus();
//                                         ev.preventDefault();
//                                     }

//                                 },
//                                 focus: (ev) => {
//                                     if (!open) {
//                                         return;
//                                     }

//                                     const el = ev.target as Element;
//                                     const rc = el.getBoundingClientRect();
//                                     // should it focus the menu?
//                                     this.menuContainer.showMainMenu(item.items, [rc.left, rc.bottom], dispatchAction);

//                                     this.menuContainer.state.menus[0].selected = 0;
//                                 },
//                                 mouseenter: (ev) => {
//                                     if (!open) {
//                                         return;
//                                     }

//                                     console.log("Menubar enter", item);
//                                     const el = ev.target as HTMLElement;
//                                     el.focus();

//                                     // const el = ev.target as Element;
//                                     // const rc = el.getBoundingClientRect();
//                                     // // we need app support here :/ - really want app.showMainMenu because it knows 
//                                     // this.menuContainer.showMainMenu(item.items, [rc.left, rc.bottom], dispatchAction);
//                                 },
//                                 pointerup: (ev) => {
//                                     console.log("Menubar click", ev, item);
//                                     if (this.menuContainer.state.menus.length > 0) {
//                                         this.menuContainer.reset();
//                                         open = false;
//                                     }
//                                 },
//                                 pointerdown: (ev) => {
//                                     console.log("Menubar mousedown", ev, item, this.menuContainer.state.menus);
//                                     // In win32/vscode, menu closes after click (mousedown+up on same element), but opens on mousedown

//                                     if (this.menuContainer.state.menus.length === 0) {
//                                         open = true;
//                                         const el = ev.target as HTMLElement;
//                                         el.focus();

//                                         // const el = ev.target as Element;
//                                         // const rc = el.getBoundingClientRect();

//                                         // this.menuContainer.showMainMenu(item.items, [rc.left, rc.bottom], dispatchAction);
//                                         preventNextButtonUp();
//                                         // open = true;
//                                         // console.log("OPEN!")
//                                     }
//                                 },
//                             })
//                         }
//                     })
//                 ],
//             }),
//         ];
//     }
// }
