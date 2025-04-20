import { MixerPanel } from "../../components/MixerPanel";
import { AddInstrumentCommand } from "./AddInstrumentCommand";
import { DeleteSelectionCommand } from "./DeleteSelectionCommand";
import { ShowPinsCommand } from "./ShowPinsCommand";

export function registerMixerCommands(component: MixerPanel) {
    component.registerCommand("add-instrument", "hgi-stroke hgi-plus-sign", null, new AddInstrumentCommand(component));
    component.registerCommand("delete-selection", "hgi-stroke hgi-minus-sign", null, new DeleteSelectionCommand(component));
    component.registerCommand("show-pins", "hgi-stroke hgi-sliders-horizontal", null, new ShowPinsCommand(component));

    // component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL+Enter", "add-instrument");
    component.registerHotkey("Enter", "show-pins");
    component.registerHotkey("Delete", "delete-selection");
}
