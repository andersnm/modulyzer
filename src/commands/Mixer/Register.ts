import { MixerPanel } from "../../components/MixerPanel";
import { AddInstrumentCommand } from "./AddInstrumentCommand";
import { DeleteSelectionCommand } from "./DeleteSelectionCommand";
import { GotoPinsCommand } from "./GotoPinsCommand";
import { GotoWaveTableCommand } from "./GotoWaveTableCommand";

export function registerMixerCommands(component: MixerPanel) {
    component.registerCommand("add-instrument", "hgi-stroke hgi-plus-sign", null, new AddInstrumentCommand(component));
    component.registerCommand("delete-selection", "hgi-stroke hgi-minus-sign", null, new DeleteSelectionCommand(component));
    component.registerCommand("goto-pins", "hgi-stroke hgi-sliders-horizontal", null, new GotoPinsCommand(component));
    component.registerCommand("goto-wavetable", "hgi-stroke hgi-radio", null, new GotoWaveTableCommand(component));

    // component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL+Enter", "add-instrument");
    component.registerHotkey("Enter", "goto-pins");
    component.registerHotkey("Delete", "delete-selection");
    component.registerHotkey("SHIFT+Enter", "goto-wavetable");
}
