import { PatternPanel } from "../../components/PatternPanel";
import { AddColumnCommand } from "./AddColumnCommand";
import { CopyCommand } from "./CopyCommand";
import { CutCommand } from "./CutCommand";
import { EditPatternCommand } from "./EditPatternCommand";
import { PasteCommand } from "./PasteCommand";

export function registerPatternEditorCommands(component: PatternPanel) {
    component.registerCommand("add-column", "hgi-stroke hgi-plus-sign", "Add a Column", new AddColumnCommand(component));
    component.registerCommand("edit-pattern", "hgi-stroke hgi-edit-03", "Edit Pattern Properties", new EditPatternCommand(component));
    component.registerCommand("cut", "hgi-stroke hgi-scissor-01", null, new CutCommand(component));
    component.registerCommand("copy", "hgi-stroke hgi-hgi-copy-01", null, new CopyCommand(component));
    component.registerCommand("paste", "hgi-stroke hgi-column-insert", null, new PasteCommand(component));

    component.registerHotkey("CTRL+A", "select-all");
    component.registerHotkey("CTRL+X", "cut");
    component.registerHotkey("CTRL+C", "copy");
    component.registerHotkey("CTRL+V", "paste");
    component.registerHotkey("ESCAPE", "show-sequence-editor");
    component.registerHotkey("CTRL+BACKSPACE", "edit-pattern");
    component.registerHotkey("CTRL+ENTER", "add-column");
    component.registerHotkey("CTRL+SHIFT+RETURN", "duplicate-pattern");
}
