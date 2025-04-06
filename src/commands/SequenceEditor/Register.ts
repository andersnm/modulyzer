import { SequencePanel } from "../../components/SequencePanel";
import { AddColumnCommand } from "./AddColumnCommand";
import { SetLoopEndCommand } from "./SetLoopEndCommand";
import { SetLoopStartCommand } from "./SetLoopStartCommand";

export function registerSequenceEditorCommands(component: SequencePanel) {
    component.registerCommand("add-column", "hgi-stroke hgi-plus-sign", null, new AddColumnCommand(component));
    component.registerCommand("set-loop-start", null, null, new SetLoopStartCommand(component));
    component.registerCommand("set-loop-end", null, null, new SetLoopEndCommand(component));

    // component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL++", "add-column");
    component.registerHotkey("CTRL+B", "set-loop-start");
    component.registerHotkey("CTRL+E", "set-loop-end");
}
