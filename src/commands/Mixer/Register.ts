import { MixerPanel } from "../../components/MixerPanel";
import { AddInstrumentCommand } from "./AddInstrumentCommand";
import { DeleteSelectionCommand } from "./DeleteSelectionCommand";

export function registerMixerCommands(component: MixerPanel) {
    component.registerCommand("add-instrument", "hgi-plus-sign", null, new AddInstrumentCommand(component));
    component.registerCommand("delete-selection", "hgi-minus-sign", null, new DeleteSelectionCommand(component));

    // component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL+ENTER", "add-instrument");
    component.registerHotkey("DELETE", "delete-selection");
}
