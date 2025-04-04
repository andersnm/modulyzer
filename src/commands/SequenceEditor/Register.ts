import { SequencePanel } from "../../components/SequencePanel";
import { AddColumnCommand } from "./AddColumnCommand";

export function registerSequenceEditorCommands(component: SequencePanel) {
    component.registerCommand("add-column", "hgi-stroke hgi-plus-sign", null, new AddColumnCommand(component));

    // component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL++", "add-column");
}
