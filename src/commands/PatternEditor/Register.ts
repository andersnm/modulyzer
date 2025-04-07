import { PatternPanel } from "../../components/PatternPanel";
import { AddColumnCommand } from "./AddColumnCommand";
import { EditPatternCommand } from "./EditPatternCommand";

export function registerPatternEditorCommands(component: PatternPanel) {
    component.registerCommand("add-column", "hgi-stroke hgi-plus-sign", "Add a Column", new AddColumnCommand(component));
    component.registerCommand("edit-pattern", "hgi-stroke hgi-edit-03", "Edit Pattern Properties", new EditPatternCommand(component));

    component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("ESCAPE", "show-sequence-editor");
    component.registerHotkey("CTRL+BACKSPACE", "edit-pattern");
    component.registerHotkey("CTRL+ENTER", "add-column");
    component.registerHotkey("CTRL+SHIFT+RETURN", "duplicate-pattern");
}
