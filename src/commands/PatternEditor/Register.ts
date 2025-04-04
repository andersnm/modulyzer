import { PatternPanel } from "../../components/PatternPanel";
import { AddColumnCommand } from "./AddColumnCommand";
import { OctaveUpCommand } from "./OctaveUpCommand";

export function registerPatternEditorCommands(component: PatternPanel) {
    component.registerCommand("add-column", null, null, new AddColumnCommand(component));

    component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("ESCAPE", "show-sequence-editor");
    component.registerHotkey("CTRL+ENTER", "add-column");
    component.registerHotkey("CTRL+SHIFT+RETURN", "duplicate-pattern");
}
